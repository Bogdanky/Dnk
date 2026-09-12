const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Trimite un meme random'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const response = await fetch('https://meme-api.com/gimme');

            if (!response.ok) {
                throw new Error(`API-ul de meme-uri a raspuns cu status ${response.status}, si nu am gasit meme-uri.`);
            }

            const meme = await response.json();

            const embed = new EmbedBuilder()
                .setColor('Random')
                .setTitle(meme.title)
                .setURL(meme.postLink)
                .setImage(meme.url)
                .setFooter({ text: `r/${meme.subreddit}` });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Eroare la /meme:', error);
            await interaction.editReply('Nu am putut aduce un meme acum, mai incearca o data.');
        }
    },
};
