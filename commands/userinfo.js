const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

const FLAG_LABELS = {
    Staff: 'Angajat Discord',
    Partner: 'Partener Discord',
    Hypesquad: 'HypeSquad Events',
    BugHunterLevel1: 'Bug Hunter',
    BugHunterLevel2: 'Bug Hunter Gold',
    HypeSquadOnlineHouse1: 'HypeSquad Bravery',
    HypeSquadOnlineHouse2: 'HypeSquad Brilliance',
    HypeSquadOnlineHouse3: 'HypeSquad Balance',
    PremiumEarlySupporter: 'Early Supporter',
    VerifiedDeveloper: 'Dezvoltator Bot Verificat',
    CertifiedModerator: 'Moderator Certificat Discord',
    ActiveDeveloper: 'Dezvoltator Activ',
};

const KEY_PERMISSIONS = [
    'Administrator',
    'ManageGuild',
    'ManageChannels',
    'ManageRoles',
    'BanMembers',
    'KickMembers',
    'ManageMessages',
    'ModerateMembers',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Afiseaza informatii detaliate despre un utilizator')
        .addUserOption(option =>
            option.setName('utilizator')
                .setDescription('Utilizatorul despre care vrei informatii (implicit tu)')
                .setRequired(false)),

    async execute(interaction) {
        const user = interaction.options.getUser('utilizator') ?? interaction.user;
        const member = await interaction.guild?.members.fetch(user.id).catch(() => null);

        const createdTs = Math.floor(user.createdTimestamp / 1000);

        const embed = new EmbedBuilder()
            .setTitle(`Informatii despre ${user.tag}`)
            .setColor(member?.displayHexColor && member.displayHexColor !== '#000000' ? member.displayHexColor : 0xFF9900)
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: 'Utilizator', value: user.tag, inline: true },
                { name: 'ID', value: user.id, inline: true },
                { name: 'Bot?', value: user.bot ? 'Da' : 'Nu', inline: true },
                { name: 'Cont creat la', value: `<t:${createdTs}:F> (<t:${createdTs}:R>)` },
            );

        if (member) {
            const joinedTs = member.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;

            embed.addFields(
                { name: 'Nickname', value: member.nickname ?? 'Fara nickname', inline: true },
                { name: 'A intrat pe server la', value: joinedTs ? `<t:${joinedTs}:F> (<t:${joinedTs}:R>)` : 'Necunoscut' },
            );

            const roles = member.roles.cache
                .filter(role => role.id !== interaction.guild.id)
                .sort((a, b) => b.position - a.position)
                .map(role => `${role}`);

            embed.addFields({
                name: `Roluri [${roles.length}]`,
                value: roles.length === 0
                    ? 'Niciun rol'
                    : roles.length > 20
                        ? `${roles.slice(0, 20).join(', ')}, +${roles.length - 20} altele`
                        : roles.join(', '),
            });

            if (member.premiumSinceTimestamp) {
                embed.addFields({
                    name: 'Boosteaza serverul din',
                    value: `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:D>`,
                    inline: true,
                });
            }

            if (member.communicationDisabledUntilTimestamp && member.communicationDisabledUntilTimestamp > Date.now()) {
                embed.addFields({
                    name: '⏱️ Timeout activ pana la',
                    value: `<t:${Math.floor(member.communicationDisabledUntilTimestamp / 1000)}:F>`,
                    inline: true,
                });
            }

            const hasKeyPerms = KEY_PERMISSIONS.filter(perm => member.permissions.has(PermissionsBitField.Flags[perm]));
            if (hasKeyPerms.length > 0) {
                embed.addFields({ name: 'Permisiuni importante', value: hasKeyPerms.join(', ') });
            }
        }

        const flags = user.flags?.toArray() ?? [];
        if (flags.length > 0) {
            const labeled = flags.map(f => FLAG_LABELS[f] ?? f);
            embed.addFields({ name: 'Insigne cont', value: labeled.join(', ') });
        }

        embed.setFooter({ text: `Cerut de ${interaction.user.tag}` }).setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
