const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addGiveaway, getGiveaway, getAllGiveaways, updateGiveaway } = require('../giveaway-store');
const { requirePermission } = require('../command-guard');

const GIVEAWAY_EMOJI = '🎉';
const MAX_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const finishing = new Set();

function parseDuration(input) {
    const match = typeof input === 'string' ? input.trim().match(/^(\d+)\s*(s|m|h|d|w)$/i) : null;
    if (!match) return null;
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 };
    const duration = value * multipliers[unit];
    return Number.isSafeInteger(duration) && duration > 0 && duration <= MAX_DURATION_MS ? duration : null;
}

async function pickWinnerIds(message, winnerCount) {
    const reaction = message.reactions.cache.get(GIVEAWAY_EMOJI);
    if (!reaction) return [];
    const users = await reaction.users.fetch();
    const eligible = Array.from(users.filter(user => !user.bot).keys());
    const winners = [];
    while (winners.length < winnerCount && eligible.length > 0) {
        const index = Math.floor(Math.random() * eligible.length);
        winners.push(eligible.splice(index, 1)[0]);
    }
    return winners;
}

async function finishGiveaway(client, messageId, initialGiveaway) {
    if (finishing.has(messageId) || initialGiveaway.ended) return false;
    finishing.add(messageId);
    try {
        let giveaway = getGiveaway(messageId) || initialGiveaway;
        if (giveaway.ended) return true;
        if ((giveaway.failureCount || 0) >= MAX_ATTEMPTS) {
            updateGiveaway(messageId, { ended: true, failed: true, processing: false });
            return false;
        }
        updateGiveaway(messageId, { processing: true });

        const channel = await client.channels.fetch(giveaway.channelId);
        if (!channel || !channel.isTextBased() || !channel.messages) throw new Error('Canalul giveaway-ului nu mai este disponibil.');
        const message = await channel.messages.fetch(messageId);
        let winnerIds = giveaway.winnerIds;
        if (!Array.isArray(winnerIds)) {
            winnerIds = await pickWinnerIds(message, giveaway.winnerCount);
            giveaway = updateGiveaway(messageId, { winnerIds, resultSelectedAt: Date.now(), processing: true }) || giveaway;
        }

        const winnerMentions = winnerIds.map(id => '<@' + id + '>').join(', ');
        const resultEmbed = new EmbedBuilder()
            .setTitle('🎉 Giveaway încheiat')
            .setColor(0x99AAB5)
            .setDescription('**Premiu:** ' + String(giveaway.prize).slice(0, 1500))
            .addFields({ name: winnerIds.length ? 'Câștigător(i)' : 'Rezultat', value: winnerIds.length ? winnerMentions : 'Nimeni nu a participat; nu există câștigători.' })
            .setFooter({ text: 'Giveaway încheiat' })
            .setTimestamp();

        await message.edit({ embeds: [resultEmbed] });
        if (!giveaway.notificationSent) {
            const notice = winnerIds.length
                ? '🎉 Felicitări ' + winnerMentions + '! Ați câștigat **' + String(giveaway.prize).slice(0, 500) + '**!'
                : 'Giveaway-ul pentru **' + String(giveaway.prize).slice(0, 500) + '** s-a încheiat fără participanți.';
            await channel.send({ content: notice, allowedMentions: { users: winnerIds, parse: [] } });
            giveaway = updateGiveaway(messageId, { notificationSent: true, processing: true }) || giveaway;
        }
        updateGiveaway(messageId, { ended: true, failed: false, processing: false, completedAt: Date.now(), nextRetryAt: null });
        return true;
    } catch (error) {
        console.error('Eroare la incheierea giveaway-ului ' + messageId + ':', error);
        try {
            const latest = getGiveaway(messageId) || initialGiveaway;
            const failureCount = (latest.failureCount || 0) + 1;
            const terminal = failureCount >= MAX_ATTEMPTS;
            const backoffMs = Math.min(60 * 60 * 1000, 30000 * (2 ** Math.min(failureCount - 1, 7)));
            updateGiveaway(messageId, {
                processing: false,
                failureCount,
                lastError: String(error.message || error).slice(0, 500),
                nextRetryAt: terminal ? null : Date.now() + backoffMs,
                ...(terminal ? { ended: true, failed: true } : {}),
            });
        } catch (storageError) {
            console.error('Nu am putut salva starea erorii giveaway-ului:', storageError);
        }
        return false;
    } finally {
        finishing.delete(messageId);
    }
}

async function startGiveaway(interaction) {
    const prize = interaction.options.getString('premiu', true).trim().slice(0, 200);
    const durationMs = parseDuration(interaction.options.getString('durata', true));
    const winnerCount = interaction.options.getInteger('castigatori') || 1;
    if (!durationMs) {
        return interaction.reply({ content: 'Durată invalidă. Folosește 10m, 2h, 1d etc. Durata maximă este 30 de zile.', ephemeral: true });
    }
    if (!prize) return interaction.reply({ content: 'Premiul nu poate fi gol.', ephemeral: true });
    if (!Number.isInteger(winnerCount) || winnerCount < 1 || winnerCount > 20) {
        return interaction.reply({ content: 'Numărul de câștigători trebuie să fie între 1 și 20.', ephemeral: true });
    }

    const endTimestamp = Date.now() + durationMs;
    const embed = new EmbedBuilder()
        .setTitle('🎉 Giveaway 🎉')
        .setColor(0xFF9900)
        .setDescription('**Premiu:** ' + prize + '\nReacționează cu ' + GIVEAWAY_EMOJI + ' ca să participi!\n\nSe încheie: <t:' + Math.floor(endTimestamp / 1000) + ':R>')
        .addFields({ name: 'Câștigători', value: String(winnerCount), inline: true })
        .setFooter({ text: 'Organizat de ' + interaction.user.tag });

    await interaction.deferReply({ ephemeral: true });
    let message;
    try {
        message = await interaction.channel.send({ embeds: [embed] });
        await message.react(GIVEAWAY_EMOJI);
        addGiveaway(message.id, {
            channelId: message.channel.id,
            guildId: interaction.guild.id,
            prize,
            winnerCount,
            endTimestamp,
            ended: false,
            hostId: interaction.user.id,
            failureCount: 0,
            winnerIds: null,
            notificationSent: false,
        });
        await interaction.editReply('Giveaway creat cu succes!');
    } catch (error) {
        console.error('Eroare la crearea giveaway-ului:', error);
        if (message) await message.delete().catch(() => {});
        await interaction.editReply('Nu am putut crea giveaway-ul complet. Verifică permisiunile botului și încearcă din nou.');
    }
}

async function endGiveawayCommand(interaction) {
    const messageId = interaction.options.getString('mesaj_id', true).trim();
    const giveaway = getGiveaway(messageId);
    if (!giveaway || giveaway.ended || giveaway.guildId !== interaction.guild.id) {
        return interaction.reply({ content: 'Nu există un giveaway activ cu acel ID în acest server.', ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });
    const success = await finishGiveaway(interaction.client, messageId, giveaway);
    const latest = getGiveaway(messageId);
    if (success || latest?.ended) {
        return interaction.editReply(latest?.failed ? 'Giveaway-ul a eșuat după mai multe încercări. Verifică logurile și permisiunile botului.' : 'Giveaway încheiat.');
    }
    return interaction.editReply('Nu am putut încheia giveaway-ul acum. Voi reîncerca automat după o pauză.');
}

async function checkExpiredGiveaways(client) {
    const all = getAllGiveaways();
    const now = Date.now();
    for (const [messageId, giveaway] of Object.entries(all)) {
        if (!giveaway.ended && giveaway.endTimestamp <= now && (!giveaway.nextRetryAt || giveaway.nextRetryAt <= now)) {
            await finishGiveaway(client, messageId, giveaway);
        }
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Sistem de giveaway-uri')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub => sub.setName('start').setDescription('Pornește un giveaway nou în acest canal')
            .addStringOption(opt => opt.setName('premiu').setDescription('Ce se câștigă').setRequired(true).setMaxLength(200))
            .addStringOption(opt => opt.setName('durata').setDescription('Durata maximă 30 de zile (ex: 10m, 2h, 1d)').setRequired(true))
            .addIntegerOption(opt => opt.setName('castigatori').setDescription('Număr de câștigători (implicit 1)').setMinValue(1).setMaxValue(20).setRequired(false)))
        .addSubcommand(sub => sub.setName('end').setDescription('Încheie manual un giveaway înainte de termen')
            .addStringOption(opt => opt.setName('mesaj_id').setDescription('ID-ul mesajului de giveaway').setRequired(true))),
    async execute(interaction) {
        if (!await requirePermission(interaction, PermissionFlagsBits.ManageGuild, 'Manage Server')) return;
        const sub = interaction.options.getSubcommand();
        if (sub === 'start') return startGiveaway(interaction);
        if (sub === 'end') return endGiveawayCommand(interaction);
    },
    checkExpiredGiveaways,
};
