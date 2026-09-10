const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
} = require('discord.js');
const { addGiveaway, getGiveaway, getAllGiveaways, updateGiveaway } = require('../giveaway-store');

const GIVEAWAY_EMOJI = '🎉';

function parseDuration(input) {
    const match = input.trim().match(/^(\d+)\s*(s|m|h|d|w)$/i);
    if (!match) return null;

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 };

    return value * multipliers[unit];
}

async function pickWinners(message, winnerCount) {
    const reaction = message.reactions.cache.get(GIVEAWAY_EMOJI);
    if (!reaction) return [];

    const users = await reaction.users.fetch();
    const eligible = Array.from(users.filter(u => !u.bot).values());
    const winners = [];

    while (winners.length < winnerCount && eligible.length > 0) {
        const index = Math.floor(Math.random() * eligible.length);
        winners.push(eligible.splice(index, 1)[0]);
    }

    return winners;
}

async function finishGiveaway(client, messageId, giveaway) {
    try {
        const channel = await client.channels.fetch(giveaway.channelId);
        const message = await channel.messages.fetch(messageId);

        const winners = await pickWinners(message, giveaway.winnerCount);

        const resultEmbed = EmbedBuilder.from(message.embeds[0])
            .setColor(0x99AAB5)
            .setFooter({ text: 'Giveaway incheiat' });

        if (winners.length === 0) {
            resultEmbed.addFields({ name: 'Rezultat', value: 'Nimeni nu a participat, nu exista castigatori.' });
            await message.edit({ embeds: [resultEmbed] });
            await channel.send(`Giveaway-ul pentru **${giveaway.prize}** s-a incheiat fara participanti.`);
        } else {
            const winnerMentions = winners.map(w => `<@${w.id}>`).join(', ');
            resultEmbed.addFields({ name: 'Castigator(i)', value: winnerMentions });
            await message.edit({ embeds: [resultEmbed] });
            await channel.send(`🎉 Felicitari ${winnerMentions}! Ai castigat **${giveaway.prize}**!`);
        }

        updateGiveaway(messageId, { ended: true });
    } catch (error) {
        console.error(`Eroare la incheierea giveaway-ului ${messageId}:`, error);
        updateGiveaway(messageId, { ended: true });
    }
}

async function startGiveaway(interaction) {
    const prize = interaction.options.getString('premiu', true);
    const durationInput = interaction.options.getString('durata', true);
    const winnerCount = interaction.options.getInteger('castigatori') ?? 1;

    const durationMs = parseDuration(durationInput);
    if (!durationMs) {
        return interaction.reply({
            content: 'Format de durata invalid. Foloseste ceva de genul `10m`, `2h`, `1d` (s=secunde, m=minute, h=ore, d=zile, w=saptamani).',
            ephemeral: true,
        });
    }

    const endTimestamp = Date.now() + durationMs;

    const embed = new EmbedBuilder()
        .setTitle('🎉 Giveaway 🎉')
        .setColor(0xFF9900)
        .setDescription(`**Premiu:** ${prize}\nReactioneaza cu ${GIVEAWAY_EMOJI} ca sa participi!\n\nSe incheie: <t:${Math.floor(endTimestamp / 1000)}:R>`)
        .addFields({ name: 'Castigatori', value: `${winnerCount}`, inline: true })
        .setFooter({ text: `Organizat de ${interaction.user.tag}` });

    await interaction.reply({ content: 'Giveaway creat!', ephemeral: true });
    const message = await interaction.channel.send({ embeds: [embed] });
    await message.react(GIVEAWAY_EMOJI);

    addGiveaway(message.id, {
        channelId: message.channel.id,
        guildId: interaction.guild.id,
        prize,
        winnerCount,
        endTimestamp,
        ended: false,
        hostId: interaction.user.id,
    });
}

async function endGiveawayCommand(interaction) {
    const messageId = interaction.options.getString('mesaj_id', true);
    const giveaway = getGiveaway(messageId);

    if (!giveaway || giveaway.ended) {
        return interaction.reply({ content: 'Nu exista un giveaway activ cu acel ID de mesaj.', ephemeral: true });
    }

    await interaction.reply({ content: 'Incheiat giveaway-ul.', ephemeral: true });
    await finishGiveaway(interaction.client, messageId, giveaway);
}

// Apelata periodic din index.js ca sa incheie automat giveaway-urile expirate.
async function checkExpiredGiveaways(client) {
    const all = getAllGiveaways();
    const now = Date.now();

    for (const [messageId, giveaway] of Object.entries(all)) {
        if (!giveaway.ended && giveaway.endTimestamp <= now) {
            await finishGiveaway(client, messageId, giveaway);
        }
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Sistem de giveaway-uri')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub =>
            sub.setName('start')
                .setDescription('Porneste un giveaway nou in acest canal')
                .addStringOption(opt => opt.setName('premiu').setDescription('Ce se castiga').setRequired(true))
                .addStringOption(opt => opt.setName('durata').setDescription('Cat dureaza (ex: 10m, 2h, 1d)').setRequired(true))
                .addIntegerOption(opt => opt.setName('castigatori').setDescription('Numar de castigatori (implicit 1)').setMinValue(1).setMaxValue(20).setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('end')
                .setDescription('Incheie manual un giveaway inainte de termen')
                .addStringOption(opt => opt.setName('mesaj_id').setDescription('ID-ul mesajului de giveaway').setRequired(true))),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        if (sub === 'start') return startGiveaway(interaction);
        if (sub === 'end') return endGiveawayCommand(interaction);
    },

    checkExpiredGiveaways,
};
