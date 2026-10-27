const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { requirePermission } = require('../command-guard');

module.exports = {
    data: new SlashCommandBuilder().setName('addrole').setDescription('Atribuie un rol unui membru')
        .addUserOption(option => option.setName('membru').setDescription('Membrul caruia ii dai rolul').setRequired(true))
        .addRoleOption(option => option.setName('rol').setDescription('Rolul de atribuit').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    async execute(interaction) {
        if (!await requirePermission(interaction, PermissionFlagsBits.ManageRoles, 'Manage Roles')) return;
        const targetUser = interaction.options.getUser('membru', true);
        const role = interaction.options.getRole('rol', true);
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!member) return interaction.reply({ content: 'Nu am gasit acel membru pe server.', ephemeral: true });
        if (member.id === interaction.user.id) return interaction.reply({ content: 'Nu iti poti atribui singur un rol prin aceasta comanda.', ephemeral: true });
        const botMember = await interaction.guild.members.fetchMe();
        if (role.managed || role.id === interaction.guild.id || role.position >= botMember.roles.highest.position) {
            return interaction.reply({ content: 'Nu pot atribui rolul selectat. Verifica daca este administrat sau daca rolul botului este suficient de sus.', ephemeral: true });
        }
        const moderatorMember = await interaction.guild.members.fetch(interaction.user.id);
        if (role.position >= moderatorMember.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: 'Nu poti atribui un rol egal sau superior celui mai inalt rol al tau.', ephemeral: true });
        }
        if (member.roles.highest.position >= moderatorMember.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: 'Nu poti modifica rolurile unui membru cu rol egal sau superior celui mai inalt rol al tau.', ephemeral: true });
        }
        try {
            await member.roles.add(role);
            await interaction.reply({ content: `Am adaugat rolul ${role} lui ${member}.`, ephemeral: true });
        } catch (error) {
            console.error('Eroare la /addrole:', error);
            await interaction.reply({ content: 'A aparut o eroare la atribuirea rolului.', ephemeral: true });
        }
    },
};
