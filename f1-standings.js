const { EmbedBuilder } = require('discord.js');
const { getGuildConfig, setGuildConfig } = require('./config-store');

const BASE_URL = 'https://api.jolpi.ca/ergast/f1';
const MEDALS = ['🥇', '🥈', '🥉'];

async function fetchStandings() {
    const [driverRes, constructorRes] = await Promise.all([
        fetch(`${BASE_URL}/current/driverStandings.json`),
        fetch(`${BASE_URL}/current/constructorStandings.json`),
    ]);

    if (!driverRes.ok || !constructorRes.ok) {
        throw new Error(`API-ul Jolpica-F1 a raspuns cu status ${driverRes.status}/${constructorRes.status}`);
    }

    const driverData = await driverRes.json();
    const constructorData = await constructorRes.json();

    const driverStandings = driverData.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
    const constructorStandings = constructorData.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? [];
    const season = driverData.MRData.StandingsTable.season;

    return { season, driverStandings, constructorStandings };
}

function formatDriverLine(entry, index) {
    const prefix = MEDALS[index] ?? `${entry.position}.`;
    const name = `${entry.Driver.givenName} ${entry.Driver.familyName}`;
    const team = entry.Constructors[0]?.name ?? '';
    return `${prefix} **${name}** (${team}) — ${entry.points} pct`;
}

function formatConstructorLine(entry, index) {
    const prefix = MEDALS[index] ?? `${entry.position}.`;
    return `${prefix} **${entry.Constructor.name}** — ${entry.points} pct`;
}

function buildStandingsEmbed({ season, driverStandings, constructorStandings }) {
    const driversText = driverStandings.slice(0, 10).map(formatDriverLine).join('\n') || 'Fara date disponibile.';
    const constructorsText = constructorStandings.slice(0, 10).map(formatConstructorLine).join('\n') || 'Fara date disponibile.';

    return new EmbedBuilder()
        .setTitle(`🏎️ Clasament Formula 1 - ${season}`)
        .setColor(0xE10600)
        .addFields(
            { name: 'Piloti', value: driversText, inline: true },
            { name: 'Constructori', value: constructorsText, inline: true },
        )
        .setFooter({ text: 'Sursa: Jolpica-F1' })
        .setTimestamp();
}

/**
 * Sterge mesajul vechi de clasament (daca exista) si posteaza unul nou, actualizat.
 * Folosita atat la pornirea botului cat si la comanda manuala /f1standings.
 */
async function refreshStandingsMessage(client, guildId) {
    const { f1StandingsChannelId, f1StandingsMessageId } = getGuildConfig(guildId);

    if (!f1StandingsChannelId) {
        return { ok: false, reason: 'not-configured' };
    }

    const channel = await client.channels.fetch(f1StandingsChannelId).catch(() => null);
    if (!channel) {
        return { ok: false, reason: 'channel-not-found' };
    }

    let standings;
    try {
        standings = await fetchStandings();
    } catch (error) {
        console.error('Eroare la aducerea clasamentului F1:', error);
        return { ok: false, reason: 'fetch-failed' };
    }

    const embed = buildStandingsEmbed(standings);

    if (f1StandingsMessageId) {
        const oldMessage = await channel.messages.fetch(f1StandingsMessageId).catch(() => null);
        if (oldMessage) await oldMessage.delete().catch(() => {});
    }

    const newMessage = await channel.send({ embeds: [embed] });
    setGuildConfig(guildId, { f1StandingsMessageId: newMessage.id });

    return { ok: true };
}

module.exports = { refreshStandingsMessage };
