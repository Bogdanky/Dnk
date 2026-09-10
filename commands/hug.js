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
            const response = await fetch('https://api.waifu.pics/sfw/hug');

            if (!response.ok) {
                throw new Error(`API-ul waifu.pics a raspuns cu status ${response.status}`);
            }

            const data = await response.json();

            const embed = new EmbedBuilder()
                .setDescription(`${interaction.user} o imbratiseaza pe ${target}! 🤗`)
                .setImage(data.url)
                .setColor(0xF783AC);

            await interaction.editReply({ content: `${target}`, embeds: [embed] });
        } catch (error) {
            console.error('Eroare la /hug:', error);
            await interaction.editReply('Nu am putut aduce un gif de imbratisare acum, mai incearca o data.');
        }
    },
};
