const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { validateFiveMAddress } = require('../security');

async function fivemFetch(ipPort, endpoint) {
    const address = validateFiveMAddress(ipPort);
    if (!['dynamic.json', 'players.json'].includes(endpoint)) throw new Error('Endpoint FiveM invalid.');
    const response = await fetch(`http://${address}/${endpoint}`, {
        signal: AbortSignal.timeout(5000),
        redirect: 'error',
        headers: { 'User-Agent': 'DnkBot/2.0' },
    });
    if (!response.ok) throw new Error(`Serverul a raspuns cu status ${response.status}`);
    return response.json();
}

function isAddressValidationError(error) {
    return /Format invalid|IP-ul trebuie|Port invalid|Introdu un IP public/.test(error.message);
}

async function statusSubcommand(interaction) {
    const input = interaction.options.getString('ip_port', true).trim();
    await interaction.deferReply();
    try {
        const address = validateFiveMAddress(input);
        const dynamic = await fivemFetch(address, 'dynamic.json');
        const embed = new EmbedBuilder()
            .setTitle(`🎮 ${String(dynamic.hostname ?? address).replace(/\^\d/g, '').slice(0, 256)}`)
            .setColor(0xF40552)
            .addFields(
                { name: 'Jucatori', value: `${dynamic.clients ?? '?'} / ${dynamic.sv_maxclients ?? '?'}`, inline: true },
                { name: 'Harta', value: String(dynamic.mapname || 'necunoscuta').slice(0, 1024), inline: true },
                { name: 'Gametype', value: String(dynamic.gametype || 'necunoscut').slice(0, 1024), inline: true },
                { name: 'IP:Port', value: `\`${address}\``, inline: true },
            ).setFooter({ text: 'Date live de la server (dynamic.json)' }).setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Eroare la /fivem status:', error);
        await interaction.editReply(isAddressValidationError(error) ? error.message : 'Nu am putut contacta acel server FiveM. Verifica IP-ul public, portul si daca serverul este pornit.');
    }
}

async function playersSubcommand(interaction) {
    const input = interaction.options.getString('ip_port', true).trim();
    await interaction.deferReply();
    try {
        const address = validateFiveMAddress(input);
        const players = await fivemFetch(address, 'players.json');
        if (!Array.isArray(players) || players.length === 0) return interaction.editReply(`Niciun jucator online momentan pe \`${address}\`.`);
        const shown = players.slice(0, 40);
        const list = shown.map(p => `\`${String(p.id ?? '?').slice(0, 30)}\` ${String(p.name ?? 'Necunoscut').replace(/[\r\n]/g, ' ').slice(0, 100)}`).join('\n');
        const extra = players.length > shown.length ? `\n... si inca ${players.length - shown.length}.` : '';
        const embed = new EmbedBuilder().setTitle(`👥 Jucatori online pe ${address}`).setColor(0xF40552)
            .setDescription(`${list}${extra}`.slice(0, 4000)).setFooter({ text: `Total: ${players.length} jucatori` });
        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Eroare la /fivem players:', error);
        await interaction.editReply(isAddressValidationError(error) ? error.message : 'Nu am putut contacta acel server FiveM. Verifica IP-ul public, portul si daca serverul este pornit.');
    }
}

async function checkSubcommand(interaction) {
    const input = interaction.options.getString('ip_port', true).trim();
    const query = interaction.options.getString('identificator', true).trim().toLowerCase().slice(0, 100);
    await interaction.deferReply();
    try {
        const address = validateFiveMAddress(input);
        const players = await fivemFetch(address, 'players.json');
        if (!Array.isArray(players)) throw new Error('Raspuns invalid de la serverul FiveM.');
        const match = players.find(p => p.name?.toLowerCase().includes(query) || p.identifiers?.some(id => String(id).toLowerCase().includes(query)));
        if (match) {
            await interaction.editReply(`✅ **${String(match.name ?? 'Necunoscut').slice(0, 100)}** e online chiar acum pe \`${address}\` (id sesiune: ${String(match.id ?? '?')}).`);
        } else {
            await interaction.editReply(`❌ Nu am gasit pe nimeni online care sa se potriveasca cu \`${query}\` pe \`${address}\`.\n-# Aceasta comanda verifica doar jucatorii conectati acum, nu baza de date de whitelist a serverului.`);
        }
    } catch (error) {
        console.error('Eroare la /fivem check:', error);
        await interaction.editReply(isAddressValidationError(error) ? error.message : 'Nu am putut contacta acel server FiveM. Verifica IP-ul public, portul si daca serverul este pornit.');
    }
}

module.exports = {
    data: new SlashCommandBuilder().setName('fivem').setDescription('Informatii despre un server FiveM')
        .addSubcommand(sub => sub.setName('status').setDescription('Status general: jucatori, harta, gametype')
            .addStringOption(opt => opt.setName('ip_port').setDescription('IP public:port, ex: 51.222.10.5:30120').setRequired(true)))
        .addSubcommand(sub => sub.setName('players').setDescription('Lista jucatorilor online')
            .addStringOption(opt => opt.setName('ip_port').setDescription('IP public:port, ex: 51.222.10.5:30120').setRequired(true)))
        .addSubcommand(sub => sub.setName('check').setDescription('Verifica daca cineva e online acum (dupa nume sau ID)')
            .addStringOption(opt => opt.setName('ip_port').setDescription('IP public:port, ex: 51.222.10.5:30120').setRequired(true))
            .addStringOption(opt => opt.setName('identificator').setDescription('Nume de jucator sau identificator').setRequired(true))),
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        if (sub === 'status') return statusSubcommand(interaction);
        if (sub === 'players') return playersSubcommand(interaction);
        if (sub === 'check') return checkSubcommand(interaction);
    },
};
