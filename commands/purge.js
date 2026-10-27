const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { requirePermission } = require('../command-guard');

module.exports = {
    data: new SlashCommandBuilder().setName('purge').setDescription('Sterge in masa mesaje recente din acest canal')
        .addIntegerOption(option => option.setName('numar').setDescription('Cate mesaje sa sterg (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        if (!await requirePermission(interaction, PermissionFlagsBits.ManageMessages, 'Manage Messages')) return;
        const amount = interaction.options.getInteger('numar', true);
        await interaction.deferReply({ ephemeral: true });
        try {
            const deleted = await interaction.channel.bulkDelete(amount, true);
            await interaction.editReply(`Am sters ${deleted.size} mesaje. Mesajele mai vechi de 14 zile sunt omise.`);
        } catch (error) {
            console.error('Eroare la /purge:', error);
            await interaction.editReply('A aparut o eroare la stergerea mesajelor. Verifica permisiunile botului si tipul canalului.');
        }
    },
};
