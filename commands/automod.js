const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setGuildConfig } = require('../config-store');
const { requirePermission } = require('../command-guard');

module.exports = {
    data: new SlashCommandBuilder().setName('automod').setDescription('Configureaza filtrele automate de moderare')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub.setName('nsfw-filter').setDescription('Porneste/opreste filtrul NSFW')
            .addBooleanOption(opt => opt.setName('activ').setDescription('true = pornit, false = oprit').setRequired(true))),
    async execute(interaction) {
        if (!await requirePermission(interaction, PermissionFlagsBits.Administrator, 'Administrator')) return;
        const enabled = interaction.options.getBoolean('activ', true);
        if (enabled && !process.env.RAPIDAPI_KEY) {
            return interaction.reply({ content: 'Lipseste RAPIDAPI_KEY din .env - filtrul nu a fost activat. Adauga cheia si incearca din nou.', ephemeral: true });
        }
        setGuildConfig(interaction.guild.id, { nsfwFilterEnabled: enabled });
        return interaction.reply({ content: `Filtrul automat NSFW este acum **${enabled ? 'ACTIV' : 'OPRIT'}** pe acest server.`, ephemeral: true });
    },
};
