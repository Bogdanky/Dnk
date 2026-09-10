const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Sterge in masa mesaje recente din acest canal')
        .addIntegerOption(option =>
            option.setName('numar')
                .setDescription('Cate mesaje sa sterg (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const amount = interaction.options.getInteger('numar', true);

        await interaction.deferReply({ ephemeral: true });

        try {
            // bulkDelete nu poate sterge mesaje mai vechi de 14 zile - le ignora automat, dar nu da eroare.
            const deleted = await interaction.channel.bulkDelete(amount, true);
            await interaction.editReply(`Am sters ${deleted.size} mesaje.`);
        } catch (error) {
            console.error('Eroare la /purge:', error);
            await interaction.editReply('A aparut o eroare la stergerea mesajelor. Verifica daca botul are permisiunea "Manage Messages".');
        }
    },
};
