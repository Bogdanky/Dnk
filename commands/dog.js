const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dog')
        .setDescription('Trimite o poza random cu un catel'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const response = await fetch('https://dog.ceo/api/breeds/image/random');

            if (!response.ok) {
                throw new Error(`API-ul dog.ceo a raspuns cu status ${response.status}`);
            }

            const data = await response.json();

            const embed = new EmbedBuilder()
                .setTitle('🐶 Woof!')
                .setImage(data.message)
                .setColor(0xFF9900);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Eroare la /dog:', error);
            await interaction.editReply('Nu am putut aduce o poza cu catel acum, mai incearca o data.');
        }
    },
};
