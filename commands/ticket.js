const {
    SlashCommandBuilder,
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const { getGuildConfig, setGuildConfig } = require('../config-store');

function sanitizeName(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 80) || 'user';
}

async function openTicket(interaction) {
    const { modRoleId, categoryId } = getGuildConfig(interaction.guild.id);

    if (!modRoleId) {
        return interaction.reply({
            content: 'Sistemul de tichete nu e configurat inca. Un admin trebuie sa ruleze `/ticket setup` mai intai.',
            ephemeral: true,
        });
    }

    const reason = interaction.options.getString('motiv') ?? 'Fara motiv specificat';

    // Nu lasam acelasi membru sa deschida doua tichete simultan - cautam dupa topic.
    const existing = interaction.guild.channels.cache.find(
        ch => ch.type === ChannelType.GuildText && ch.topic === `ticket-owner:${interaction.user.id}`,
    );

    if (existing) {
        return interaction.reply({ content: `Ai deja un tichet deschis: ${existing}`, ephemeral: true });
    }

    let channel;
    try {
        channel = await interaction.guild.channels.create({
            name: `ticket-${sanitizeName(interaction.user.username)}`,
            type: ChannelType.GuildText,
            parent: categoryId,
            topic: `ticket-owner:${interaction.user.id}`,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles,
                    ],
                },
                {
                    id: modRoleId,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                    ],
                },
                {
                    id: interaction.client.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.ReadMessageHistory,
                    ],
                },
            ],
        });
    } catch (error) {
        console.error('Eroare la crearea tichetului:', error);
        return interaction.reply({
            content: 'Nu am putut crea canalul de tichet. Verifica daca botul are permisiunea "Manage Channels".',
            ephemeral: true,
        });
    }

    const embed = new EmbedBuilder()
        .setTitle('🎫 Tichet nou')
        .setDescription(`Deschis de ${interaction.user}\n**Motiv:** ${reason}`)
        .setColor(0xFF9900)
        .setFooter({ text: 'Un moderator va raspunde in curand.' })
        .setTimestamp();

    const closeButton = new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('Inchide tichetul')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒');

    const row = new ActionRowBuilder().addComponents(closeButton);

    await channel.send({
        content: `${interaction.user} <@&${modRoleId}>`,
        embeds: [embed],
        components: [row],
    });

    await interaction.reply({ content: `Tichetul tau a fost creat: ${channel}`, ephemeral: true });
}

async function closeTicket(interaction) {
    const channel = interaction.channel;

    if (!channel.topic?.startsWith('ticket-owner:')) {
        return interaction.reply({
            content: 'Aceasta actiune functioneaza doar in interiorul unui canal de tichet.',
            ephemeral: true,
        });
    }

    const ownerId = channel.topic.split(':')[1];
    const { modRoleId } = getGuildConfig(interaction.guild.id);
    const member = interaction.member;

    const isMod = modRoleId && member.roles.cache.has(modRoleId);
    const isOwner = interaction.user.id === ownerId;
    const canManage = member.permissions.has(PermissionFlagsBits.ManageChannels);

    if (!isMod && !isOwner && !canManage) {
        return interaction.reply({ content: 'Nu ai voie sa inchizi acest tichet.', ephemeral: true });
    }

    await interaction.reply('🔒 Tichetul se va inchide in 5 secunde...');
    setTimeout(() => {
        channel.delete().catch(err => console.error('Eroare la stergerea tichetului:', err));
    }, 5000);
}

async function setupTicket(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: 'Doar administratorii pot configura sistemul de tichete.', ephemeral: true });
    }

    const role = interaction.options.getRole('rol_moderator', true);
    const category = interaction.options.getChannel('categorie');

    const updates = { modRoleId: role.id };
    if (category) updates.categoryId = category.id;

    setGuildConfig(interaction.guild.id, updates);

    const embed = new EmbedBuilder()
        .setTitle('✅ Setup tichete salvat')
        .setColor(0x57F287)
        .addFields(
            { name: 'Rol moderator', value: `${role}`, inline: true },
            { name: 'Categorie', value: category ? `${category}` : 'Fara categorie (canalele se creeaza in afara oricarei categorii)', inline: true },
        );

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Sistem de tichete private')
        .addSubcommand(sub =>
            sub.setName('open')
                .setDescription('Deschide un tichet privat, vizibil doar tie si moderatorilor')
                .addStringOption(opt =>
                    opt.setName('motiv')
                        .setDescription('Motivul tichetului')
                        .setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('close')
                .setDescription('Inchide tichetul curent (ruleaz-o in interiorul canalului de tichet)'))
        .addSubcommand(sub =>
            sub.setName('setup')
                .setDescription('(Admin) Configureaza rolul de moderator si categoria pentru tichete')
                .addRoleOption(opt =>
                    opt.setName('rol_moderator')
                        .setDescription('Rolul care va vedea toate tichetele')
                        .setRequired(true))
                .addChannelOption(opt =>
                    opt.setName('categorie')
                        .setDescription('Categoria in care se creeaza canalele de tichete (optional)')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(false))),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        if (sub === 'open') return openTicket(interaction);
        if (sub === 'close') return closeTicket(interaction);
        if (sub === 'setup') return setupTicket(interaction);
    },

    // Exportata separat ca sa poata fi apelata si de butonul "Inchide tichetul" din index.js
    closeTicket,
};
