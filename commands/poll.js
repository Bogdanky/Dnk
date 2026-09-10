const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Creeaza un sondaj simplu cu da/nu')
        .addStringOption(option =>
            option.setName('intrebare')
                .setDescription('Subiectul sondajului')
                .setRequired(true)),

    async execute(interaction) {
        const question = interaction.options.getString('intrebare');

        const embed = new EmbedBuilder()
            .setColor(0xF1C40F)
            .setTitle('📝 Sondaj')
            .setDescription(question)
            .setFooter({ text: `Initiat de ${interaction.user.tag}` });

        // Trimitem sondajul ca mesaj normal (nu ca raspuns ephemeral) ca sa putem reactiona la el.
        await interaction.reply({ embeds: [embed] });
        const message = await interaction.fetchReply();

        await message.react('👍');
        await message.react('👎');
    },
};
