const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setGuildConfig } = require('../config-store');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Configureaza filtrele automate de moderare')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('nsfw-filter')
                .setDescription('Porneste/opreste stergerea automata a imaginilor NSFW din canale normale')
                .addBooleanOption(opt =>
                    opt.setName('activ')
                        .setDescription('true = pornit, false = oprit')
                        .setRequired(true))),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'nsfw-filter') {
            const enabled = interaction.options.getBoolean('activ', true);
            setGuildConfig(interaction.guild.id, { nsfwFilterEnabled: enabled });

            if (enabled && !process.env.RAPIDAPI_KEY) {
                return interaction.reply({
                    content: 'Am salvat setarea, dar lipseste RAPIDAPI_KEY din .env - filtrul nu va face nimic pana adaugi o cheie valida de la RapidAPI (api4ai/nsfw3).',
                    ephemeral: true,
                });
            }

            await interaction.reply({
                content: `Filtrul automat NSFW este acum **${enabled ? 'ACTIV' : 'OPRIT'}** pe acest server.`,
                ephemeral: true,
            });
        }
    },
};
