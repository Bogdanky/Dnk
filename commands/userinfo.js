const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Afiseaza informatii despre un utilizator')
        .addUserOption(option =>
            option.setName('utilizator')
                .setDescription('Utilizatorul despre care vrei informatii (implicit tu)')
                .setRequired(false)),

    async execute(interaction) {
        const user = interaction.options.getUser('utilizator') ?? interaction.user;
        const member = interaction.guild?.members.cache.get(user.id);

        const embed = new EmbedBuilder()
            .setTitle('Informatii utilizator')
            .setColor(0xFF9900)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: 'Utilizator', value: user.tag, inline: true },
                { name: 'ID', value: user.id, inline: true },
                { name: 'Cont creat la', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true },
            )
            .setFooter({ text: 'Informatii utilizator' });

        if (member?.joinedTimestamp) {
            embed.addFields({
                name: 'A intrat pe server la',
                value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`,
                inline: true,
            });
        }

        await interaction.reply({ embeds: [embed] });
    },
};
