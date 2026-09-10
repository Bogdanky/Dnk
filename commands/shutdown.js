const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shutdown')
        .setDescription('(Owner) Opreste botul complet')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const ownerId = process.env.OWNER_ID;

        if (!ownerId || interaction.user.id !== ownerId) {
            return interaction.reply({ content: 'Doar owner-ul botului poate folosi aceasta comanda.', ephemeral: true });
        }

        await interaction.reply('👋 Ma opresc acum...');
        interaction.client.destroy();
        process.exit(0);
    },
};
