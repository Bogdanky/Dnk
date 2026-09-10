const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Afiseaza informatii despre acest server'),

    async execute(interaction) {
        const { guild } = interaction;
        const owner = await guild.fetchOwner();

        const embed = new EmbedBuilder()
            .setTitle(`Informatii despre ${guild.name}`)
            .setColor(0xFF9900)
            .setThumbnail(guild.iconURL())
            .addFields(
                { name: 'Proprietar', value: `${owner}`, inline: true },
                { name: 'Membri', value: `${guild.memberCount}`, inline: true },
                { name: 'Creat la', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
                { name: 'Roluri', value: `${guild.roles.cache.size}`, inline: true },
                { name: 'Emoji-uri', value: `${guild.emojis.cache.size}`, inline: true },
                { name: 'Canale', value: `${guild.channels.cache.size}`, inline: true },
            )
            .setFooter({ text: `ID: ${guild.id}` });

        await interaction.reply({ embeds: [embed] });
    },
};
