const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

async function fivemFetch(ipPort, endpoint) {
    const response = await fetch(`http://${ipPort}/${endpoint}`, {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'DnkBot/1.0' },
    });
    if (!response.ok) throw new Error(`Serverul a raspuns cu status ${response.status}`);
    return response.json();
}

async function statusSubcommand(interaction) {
    const ipPort = interaction.options.getString('ip_port', true).trim();
    await interaction.deferReply();

    try {
        const dynamic = await fivemFetch(ipPort, 'dynamic.json');

        const embed = new EmbedBuilder()
            .setTitle(`🎮 ${dynamic.hostname?.replace(/\^\d/g, '') || ipPort}`)
            .setColor(0xF40552)
            .addFields(
                { name: 'Jucatori', value: `${dynamic.clients} / ${dynamic.sv_maxclients}`, inline: true },
                { name: 'Harta', value: dynamic.mapname || 'necunoscuta', inline: true },
                { name: 'Gametype', value: dynamic.gametype || 'necunoscut', inline: true },
                { name: 'IP:Port', value: `\`${ipPort}\``, inline: true },
            )
            .setFooter({ text: 'Date live de la server (dynamic.json)' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Eroare la /fivem status:', error);
        await interaction.editReply('Nu am putut contacta acel server FiveM. Verifica ca IP:port e corect si ca serverul e pornit.');
    }
}

async function playersSubcommand(interaction) {
    const ipPort = interaction.options.getString('ip_port', true).trim();
    await interaction.deferReply();

    try {
        const players = await fivemFetch(ipPort, 'players.json');

        if (!Array.isArray(players) || players.length === 0) {
            return interaction.editReply(`Niciun jucator online momentan pe \`${ipPort}\`.`);
        }

        const shown = players.slice(0, 40);
        const list = shown.map(p => `\`${p.id}\` ${p.name}`).join('\n');
        const extra = players.length > shown.length ? `\n... si inca ${players.length - shown.length}.` : '';

        const embed = new EmbedBuilder()
            .setTitle(`👥 Jucatori online pe ${ipPort}`)
            .setColor(0xF40552)
            .setDescription(`${list}${extra}`)
            .setFooter({ text: `Total: ${players.length} jucatori` });

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Eroare la /fivem players:', error);
        await interaction.editReply('Nu am putut contacta acel server FiveM. Verifica ca IP:port e corect si ca serverul e pornit.');
    }
}

async function checkSubcommand(interaction) {
    const ipPort = interaction.options.getString('ip_port', true).trim();
    const query = interaction.options.getString('identificator', true).trim().toLowerCase();
    await interaction.deferReply();

    try {
        const players = await fivemFetch(ipPort, 'players.json');

        const match = players.find(p =>
            p.name?.toLowerCase().includes(query) ||
            p.identifiers?.some(id => id.toLowerCase().includes(query)),
        );

        if (match) {
            await interaction.editReply(
                `✅ **${match.name}** e online chiar acum pe \`${ipPort}\` (id sesiune: ${match.id}).`,
            );
        } else {
            await interaction.editReply(
                `❌ Nu am gasit pe nimeni online care sa se potriveasca cu \`${query}\` pe \`${ipPort}\`.\n` +
                `-# Asta verifica doar cine e conectat acum, nu baza de date de whitelist a serverului - FiveM nu expune public acele date, ele depind de framework-ul (ESX/QBCore/etc.) folosit de fiecare server in parte.`,
            );
        }
    } catch (error) {
        console.error('Eroare la /fivem check:', error);
        await interaction.editReply('Nu am putut contacta acel server FiveM. Verifica ca IP:port e corect si ca serverul e pornit.');
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fivem')
        .setDescription('Informatii despre un server FiveM')
        .addSubcommand(sub =>
            sub.setName('status')
                .setDescription('Status general: jucatori, harta, gametype')
                .addStringOption(opt => opt.setName('ip_port').setDescription('IP:port, ex: 51.222.10.5:30120').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('players')
                .setDescription('Lista jucatorilor online')
                .addStringOption(opt => opt.setName('ip_port').setDescription('IP:port, ex: 51.222.10.5:30120').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('check')
                .setDescription('Verifica daca cineva e online acum (dupa nume sau ID)')
                .addStringOption(opt => opt.setName('ip_port').setDescription('IP:port, ex: 51.222.10.5:30120').setRequired(true))
                .addStringOption(opt => opt.setName('identificator').setDescription('Nume de jucator, Steam ID, Discord ID etc.').setRequired(true))),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        if (sub === 'status') return statusSubcommand(interaction);
        if (sub === 'players') return playersSubcommand(interaction);
        if (sub === 'check') return checkSubcommand(interaction);
    },
};
