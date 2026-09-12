const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cat')
        .setDescription('Trimite o poza random cu o pisica'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const response = await fetch('https://api.thecatapi.com/v1/images/search');

            if (!response.ok) {
                throw new Error(`API-ul de pisici a raspuns cu status ${response.status}`);
            }

            const [data] = await response.json();

            const embed = new EmbedBuilder()
                .setTitle('🐱 Miauuuuuuuuuu!')
                .setImage(data.url)
                .setColor(0xFF9900);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Eroare la /cat:', error);
            await interaction.editReply('Nu am putut aduce o poza cu pisica acum, mai incearca o data.');
        }
    },
};
