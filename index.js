require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const {
    Client,
    Collection,
    GatewayIntentBits,
    Partials,
    ActivityType,
    AuditLogEvent,
    EmbedBuilder,
} = require('discord.js');

const { getGuildConfig, getAllGuildIds } = require('./config-store');
const { isImageNsfw } = require('./nsfw-filter');
const { sendLog, baseEmbed, fetchExecutor } = require('./audit-log');
const { getRoleForReaction } = require('./reaction-role-store');
const { getStarboardEntry, setStarboardEntry } = require('./starboard-store');
const { prefixCommands } = require('./prefix-commands');
const { refreshStandingsMessage } = require('./f1-standings');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        // Privilegiate - trebuie activate manual in Developer Portal, tab Bot:
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        // Neprivilegiate, dar tot trebuie declarate:
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Message, Partials.Reaction, Partials.User, Partials.GuildMember],
});

// Colectie in care incarcam toate comenzile, cheia fiind numele comenzii.
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
        command.filePath = filePath; // folosit de /reload ca sa stie ce fisier sa re-incarce
        client.commands.set(command.data.name, command);
    } else {
        console.warn(`[AVERTISMENT] Comanda din ${filePath} nu are proprietatile "data" sau "execute".`);
    }
}

client.once('clientReady', () => {
    console.log(`Botto e online ca ${client.user.tag}`);
    client.user.setPresence({
        activities: [{ name: `${client.guilds.cache.size} servere`, type: ActivityType.Watching }],
        status: 'online',
    });

    // Verifica din 30 in 30 de secunde daca vreun giveaway a expirat si trebuie incheiat automat.
    const giveawayCommand = client.commands.get('giveaway');
    if (giveawayCommand?.checkExpiredGiveaways) {
        setInterval(() => giveawayCommand.checkExpiredGiveaways(client), 30_000);
    }

    // La fiecare pornire/restart, actualizeaza (sterge + reposteaza) clasamentul F1 pe fiecare server configurat.
    for (const guildId of getAllGuildIds()) {
        refreshStandingsMessage(client, guildId).catch(error =>
            console.error(`Eroare la actualizarea clasamentului F1 pentru serverul ${guildId}:`, error),
        );
    }
    setInterval(async () => {
        console.log('🔄 Auto-restart dupa 1 ora - deconectez si reconectez...');
        try {
            await client.destroy();
            // Asteapta 2 secunde, apoi reconnect
            setTimeout(() => {
                client.login(process.env.DISCORD_TOKEN);
            }, 2000);
        } catch (error) {
            console.error('Eroare la auto-restart:', error);
        }
    }, 3600000);
});

// ---------- Slash commands + butonul de tichet ----------

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`Nu a fost gasita nicio comanda cu numele ${interaction.commandName}.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Eroare la executarea comenzii ${interaction.commandName}:`, error);

            const errorReply = { content: 'A aparut o eroare la executarea acestei comenzi.', ephemeral: true };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorReply);
            } else {
                await interaction.reply(errorReply);
            }
        }
        return;
    }

    if (interaction.isButton() && interaction.customId === 'ticket_close') {
        const ticketCommand = interaction.client.commands.get('ticket');
        try {
            await ticketCommand.closeTicket(interaction);
        } catch (error) {
            console.error('Eroare la inchiderea tichetului din buton:', error);
        }
    }
});

// ---------- Mesaje: prefix commands + filtru NSFW ----------

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    const { prefix, nsfwFilterEnabled } = getGuildConfig(message.guild.id);

    if (prefix && message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/\s+/);
        const commandName = args.shift()?.toLowerCase();
        const prefixCommand = commandName ? prefixCommands.get(commandName) : null;

        if (prefixCommand) {
            try {
                await prefixCommand.execute(message, args, prefix);
            } catch (error) {
                console.error(`Eroare la comanda cu prefix ${commandName}:`, error);
            }
            return;
        }
    }

    if (message.channel.nsfw) return; // canal deja marcat NSFW - continutul e permis acolo
    if (!nsfwFilterEnabled || !process.env.RAPIDAPI_KEY) return;

    const imageAttachments = message.attachments.filter(a => a.contentType?.startsWith('image/'));
    if (imageAttachments.size === 0) return;

    for (const attachment of imageAttachments.values()) {
        try {
            const flagged = await isImageNsfw(attachment.url);

            if (flagged) {
                await message.delete().catch(() => {});
                const warning = await message.channel.send(
                    `${message.author}, imaginea ta a fost stearsa automat - a fost detectata drept continut NSFW, iar acest canal nu e marcat ca atare.`,
                );
                setTimeout(() => warning.delete().catch(() => {}), 8000);
                break;
            }
        } catch (error) {
            console.error('Eroare la verificarea NSFW a unei imagini:', error);
        }
    }
});

// ---------- Welcome + autorole ----------

client.on('guildMemberAdd', async member => {
    const { welcomeChannelId, welcomeMessage, autoRoleId } = getGuildConfig(member.guild.id);

    if (welcomeChannelId && welcomeMessage) {
        const channel = await member.guild.channels.fetch(welcomeChannelId).catch(() => null);
        if (channel) {
            const text = welcomeMessage.replaceAll('{user}', `${member}`).replaceAll('{server}', member.guild.name);
            await channel.send(text).catch(error => console.error('Eroare la trimiterea mesajului de welcome:', error));
        }
    }

    if (autoRoleId) {
        await member.roles.add(autoRoleId).catch(error => console.error('Eroare la atribuirea autorole:', error));
    }
});

// ---------- Audit log: kick vs. plecare, ban, timeout, mesaje sterse ----------

client.on('guildMemberRemove', async member => {
    const executor = await fetchExecutor(member.guild, AuditLogEvent.MemberKick, member.id);

    if (executor) {
        await sendLog(client, member.guild.id, baseEmbed('🥾 Membru dat afara (kick)', 0xED4245)
            .addFields(
                { name: 'Membru', value: `${member.user?.tag ?? member.id} (${member.id})` },
                { name: 'Moderator', value: `${executor.tag}` },
            ));
    } else {
        await sendLog(client, member.guild.id, baseEmbed('👋 Membru a plecat', 0x99AAB5)
            .addFields({ name: 'Membru', value: `${member.user?.tag ?? member.id} (${member.id})` }));
    }
});

client.on('guildBanAdd', async ban => {
    const executor = await fetchExecutor(ban.guild, AuditLogEvent.MemberBanAdd, ban.user.id);

    await sendLog(client, ban.guild.id, baseEmbed('🔨 Membru banat', 0xED4245)
        .addFields(
            { name: 'Membru', value: `${ban.user.tag} (${ban.user.id})` },
            { name: 'Moderator', value: executor ? `${executor.tag}` : 'Necunoscut' },
            { name: 'Motiv', value: ban.reason ?? 'Fara motiv specificat' },
        ));
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const oldTs = oldMember.communicationDisabledUntilTimestamp;
    const newTs = newMember.communicationDisabledUntilTimestamp;
    if (oldTs === newTs) return;

    if (newTs && newTs > Date.now()) {
        await sendLog(client, newMember.guild.id, baseEmbed('🔇 Timeout aplicat', 0xFEE75C)
            .addFields(
                { name: 'Membru', value: `${newMember.user.tag} (${newMember.id})` },
                { name: 'Pana la', value: `<t:${Math.floor(newTs / 1000)}:F>` },
            ));
    } else {
        await sendLog(client, newMember.guild.id, baseEmbed('🔊 Timeout eliminat', 0x57F287)
            .addFields({ name: 'Membru', value: `${newMember.user.tag} (${newMember.id})` }));
    }
});

client.on('messageDelete', async message => {
    if (message.partial || !message.guild || message.author?.bot) return;
    if (!message.content && message.attachments.size === 0) return;

    await sendLog(client, message.guild.id, baseEmbed('🗑️ Mesaj sters', 0x99AAB5)
        .addFields(
            { name: 'Autor', value: `${message.author?.tag ?? 'Necunoscut'}` },
            { name: 'Canal', value: `${message.channel}` },
            { name: 'Continut', value: message.content ? message.content.slice(0, 1000) : '*(fara text, doar atasamente)*' },
        ));
});

// ---------- Reaction roles + starboard ----------

async function resolveReaction(reaction, user) {
    if (user.bot) return null;

    try {
        if (reaction.partial) await reaction.fetch();
        if (reaction.message.partial) await reaction.message.fetch();
    } catch (error) {
        console.error('Nu am putut incarca reactia/mesajul (probabil prea vechi):', error);
        return null;
    }

    if (!reaction.message.guild) return null;
    return reaction;
}

async function handleStarboard(message) {
    const { starboardChannelId, starThreshold } = getGuildConfig(message.guild.id);
    if (!starboardChannelId || message.channel.id === starboardChannelId) return;

    const starReaction = message.reactions.cache.get('⭐');
    const count = starReaction?.count ?? 0;
    if (count < starThreshold) return;

    const starboardChannel = await message.client.channels.fetch(starboardChannelId).catch(() => null);
    if (!starboardChannel) return;

    const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
        .setDescription(message.content || '*(fara text)*')
        .addFields({ name: 'Sursa', value: `[Sari la mesaj](${message.url}) in ${message.channel}` })
        .setTimestamp(message.createdTimestamp)
        .setFooter({ text: `⭐ ${count}` });

    const imageAttachment = message.attachments.find(a => a.contentType?.startsWith('image/'));
    if (imageAttachment) embed.setImage(imageAttachment.url);

    const existingId = getStarboardEntry(message.id);

    if (existingId) {
        const starboardMessage = await starboardChannel.messages.fetch(existingId).catch(() => null);
        if (starboardMessage) {
            await starboardMessage.edit({ embeds: [embed] }).catch(() => {});
            return;
        }
    }

    const posted = await starboardChannel.send({ embeds: [embed] });
    setStarboardEntry(message.id, posted.id);
}

client.on('messageReactionAdd', async (rawReaction, user) => {
    const reaction = await resolveReaction(rawReaction, user);
    if (!reaction) return;

    const { message, emoji } = reaction;

    const emojiKey = emoji.id ?? emoji.name;
    const roleId = getRoleForReaction(message.id, emojiKey);
    if (roleId) {
        const member = await message.guild.members.fetch(user.id).catch(() => null);
        if (member) await member.roles.add(roleId).catch(error => console.error('Eroare la adaugarea rolului prin reactie:', error));
    }

    if (emoji.name === '⭐') await handleStarboard(message);
});

client.on('messageReactionRemove', async (rawReaction, user) => {
    const reaction = await resolveReaction(rawReaction, user);
    if (!reaction) return;

    const { message, emoji } = reaction;

    const emojiKey = emoji.id ?? emoji.name;
    const roleId = getRoleForReaction(message.id, emojiKey);
    if (roleId) {
        const member = await message.guild.members.fetch(user.id).catch(() => null);
        if (member) await member.roles.remove(roleId).catch(error => console.error('Eroare la stergerea rolului prin reactie:', error));
    }

    if (emoji.name === '⭐') await handleStarboard(message);
});

client.login(process.env.DISCORD_TOKEN);
