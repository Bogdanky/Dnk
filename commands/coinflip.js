const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Arunca o moneda'),

    async execute(interaction) {
        const result = Math.random() < 0.5 ? 'Cap' : 'Pajura';

        const embed = new EmbedBuilder()
            .setTitle('🪙 Coinflip')
            .setDescription(`A iesit **${result}**!`)
            .setColor(0xFF9900);

        await interaction.reply({ embeds: [embed] });
    },
};
