const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('./config-store');

/**
 * Trimite un embed de log in canalul configurat pentru acel server, daca exista unul.
 */
async function sendLog(client, guildId, embed) {
    const { logChannelId } = getGuildConfig(guildId);
    if (!logChannelId) return;

    try {
        const channel = await client.channels.fetch(logChannelId);
        await channel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`Nu am putut trimite log-ul pe serverul ${guildId}:`, error);
    }
}

function baseEmbed(title, color) {
    return new EmbedBuilder().setTitle(title).setColor(color).setTimestamp();
}

/**
 * Cauta in audit log-ul serverului o actiune recenta (in ultimele 10 secunde) de un anumit
 * tip, care are drept tinta un anumit user. Util ca sa stim, de exemplu, daca cineva a fost
 * dat afara (kick) sau doar a plecat singur de pe server - Discord nu ne spune asta direct.
 */
async function fetchExecutor(guild, auditLogType, targetId) {
    try {
        const logs = await guild.fetchAuditLogs({ type: auditLogType, limit: 5 });
        const entry = logs.entries.find(e => e.target?.id === targetId && Date.now() - e.createdTimestamp < 10_000);
        return entry?.executor ?? null;
    } catch {
        return null; // botul probabil nu are permisiunea "View Audit Log"
    }
}

module.exports = { sendLog, baseEmbed, fetchExecutor };
