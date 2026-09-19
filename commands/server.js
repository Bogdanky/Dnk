const { SlashCommandBuilder, EmbedBuilder, GuildVerificationLevel } = require('discord.js');

const VERIFICATION_LABELS = {
    [GuildVerificationLevel.None]: 'Fara verificare',
    [GuildVerificationLevel.Low]: 'Scazuta (email verificat)',
    [GuildVerificationLevel.Medium]: 'Medie (cont Discord > 5 min)',
    [GuildVerificationLevel.High]: 'Inalta (membru > 10 min)',
    [GuildVerificationLevel.VeryHigh]: 'Foarte inalta (telefon verificat)',
};

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
                { name: 'Nivel verificare', value: VERIFICATION_LABELS[guild.verificationLevel] ?? 'Necunoscut', inline: true },
                { name: 'Boost-uri', value: `${guild.premiumSubscriptionCount ?? 0} (nivel ${guild.premiumTier})`, inline: true },
                { name: 'Canal AFK', value: guild.afkChannel ? `${guild.afkChannel}` : 'nesetat', inline: true },
            )
            .setFooter({ text: `ID: ${guild.id}` });

        if (guild.vanityURLCode) {
            embed.addFields({ name: 'Invitatie personalizata', value: `discord.gg/${guild.vanityURLCode}` });
        }

        if (guild.features.length > 0) {
            embed.addFields({ name: 'Functii speciale', value: guild.features.slice(0, 10).join(', ') });
        }

        await interaction.reply({ embeds: [embed] });
    },
};
