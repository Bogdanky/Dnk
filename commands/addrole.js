const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addrole')
        .setDescription('Atribuie un rol unui membru')
        .addUserOption(option =>
            option.setName('membru')
                .setDescription('Membrul caruia ii dai rolul')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('rol')
                .setDescription('Rolul de atribuit')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('membru', true);
        const role = interaction.options.getRole('rol', true);

        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!member) {
            return interaction.reply({ content: 'Nu am gasit acel membru pe server.', ephemeral: true });
        }

        // Botul nu poate atribui un rol mai sus (sau egal) decat propriul lui rol cel mai inalt.
        const botMember = await interaction.guild.members.fetchMe();
        if (role.position >= botMember.roles.highest.position) {
            return interaction.reply({
                content: `Nu pot atribui rolul ${role} - e mai sus (sau la fel de sus) decat propriul meu rol. Muta rolul botului mai sus in lista de roluri.`,
                ephemeral: true,
            });
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
