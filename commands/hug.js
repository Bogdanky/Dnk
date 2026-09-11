const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hug')
        .setDescription('Imbratiseaza pe cineva')
        .addUserOption(option =>
            option.setName('membru')
                .setDescription('Cine primeste imbratisarea')
                .setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getUser('membru', true);

        if (target.id === interaction.user.id) {
            return interaction.reply({ content: 'Nu te poti imbratisa singur... sau poate poti, dar e ciudat.', ephemeral: true });
        }

        if (target.bot) {
            return interaction.reply({ content: 'Boturile nu au nevoie de imbratisari (probabil).', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const response = await fetch('https://nekos.best/api/v2/hug', {
                headers: { 'User-Agent': 'DnkBot/1.0 (https://discord.com)' },
            });

            if (!response.ok) {
                throw new Error(`API-ul nekos.best a raspuns cu status ${response.status}`);
            }

            const data = await response.json();
            const result = data.results[0];

            const embed = new EmbedBuilder()
                .setDescription(`${interaction.user} o imbratiseaza pe ${target}! 🤗`)
                .setImage(result.url)
                .setColor(0xF783AC);

            if (result.anime_name) {
                embed.setFooter({ text: `Sursa: ${result.anime_name}` });
            }

            await interaction.editReply({ content: `${target}`, embeds: [embed] });
        } catch (error) {
            console.error('Eroare la /hug:', error);
            await interaction.editReply('Nu am putut aduce un gif de imbratisare acum, mai incearca o data.');
        }
    },
};