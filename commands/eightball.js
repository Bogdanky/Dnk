const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const REPLIES = [
    'Da',
    'Nu',
    'Intreaba din nou mai tarziu',
    'Sigur',
    'Nu conta pe asta',
    'Semnele indica da',
    'Perspectiva nu e buna',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Bila magica iti raspunde la o intrebare')
        .addStringOption(option =>
            option.setName('intrebare')
                .setDescription('Ce vrei sa intrebi?')
                .setRequired(true)),

    async execute(interaction) {
        const question = interaction.options.getString('intrebare');
        const answer = REPLIES[Math.floor(Math.random() * REPLIES.length)];

        const embed = new EmbedBuilder()
            .setTitle('🎱 8Ball')
            .addFields(
                { name: 'Intrebare', value: question },
                { name: 'Raspuns', value: answer },
            )
            .setColor(0xFF9900)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
            .setThumbnail('https://cdn3.volusion.com/rwhao.mcoqv/v/vspfiles/photos/8BALL-2.jpg');

        await interaction.reply({ embeds: [embed] });
    },
};
