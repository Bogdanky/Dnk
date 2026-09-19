const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { addYoutubeWatch, removeYoutubeWatch, getGuildWatches, setYoutubeLastVideo } = require('../notify-store');
const { extractChannelIdFromUrl, fetchLatestVideo } = require('../youtube-watcher');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('youtube')
        .setDescription('Gestioneaza canalele YouTube urmarite pentru notificari de clipuri noi')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Adauga un canal YouTube de urmarit')
                .addStringOption(opt => opt.setName('canal_youtube').setDescription('URL cu ID (contine UCxxxx) sau ID direct').setRequired(true))
                .addChannelOption(opt =>
                    opt.setName('canal_discord')
                        .setDescription('Unde sa anunt clipurile noi')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Elimina un canal YouTube urmarit')
                .addStringOption(opt => opt.setName('id').setDescription('ID-ul canalului (UCxxxx) - vezi /youtube list').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('Lista canalelor YouTube urmarite pe acest server')),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (sub === 'list') {
            const { youtube } = getGuildWatches(guildId);
            if (youtube.length === 0) {
                return interaction.reply({ content: 'Niciun canal YouTube urmarit inca. Foloseste `/youtube add`.', ephemeral: true });
            }
            const lines = youtube.map(w => `**${w.channelName ?? w.channelId}** — \`${w.channelId}\` → <#${w.discordChannelId}>`);
            return interaction.reply({ content: lines.join('\n'), ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        if (sub === 'add') {
            const input = interaction.options.getString('canal_youtube', true).trim();
            const discordChannel = interaction.options.getChannel('canal_discord', true);

            const channelId = extractChannelIdFromUrl(input);
            if (!channelId) {
                return interaction.editReply(
                    'Nu am putut extrage ID-ul canalului. Trebuie sa contina un segment de forma `UCxxxxxxxxxxxxxxxxxxxxxx` - ' +
                    'daca URL-ul canalului foloseste doar @handle, mergi pe pagina canalului -> "Despre" -> "Distribuie canal" ca sa gasesti URL-ul cu ID.',
                );
            }

            const latest = await fetchLatestVideo(channelId).catch(() => null);
            const displayName = latest?.author ?? channelId;

            const added = addYoutubeWatch(guildId, channelId, displayName, discordChannel.id);
            if (!added) {
                return interaction.editReply('Canalul asta e deja urmarit.');
            }

            setYoutubeLastVideo(guildId, channelId, latest?.videoId ?? null);
            await interaction.editReply(
                `Am inceput sa urmaresc **${displayName}**, anunt in ${discordChannel}. Te anunt doar la clipurile viitoare, nu la cele deja existente.`,
            );
        }

        if (sub === 'remove') {
            const channelId = interaction.options.getString('id', true).trim();
            const removed = removeYoutubeWatch(guildId, channelId);
            await interaction.editReply(removed ? 'Canal eliminat de la urmarire.' : 'Nu am gasit acel canal in lista urmarita.');
        }
    },
};
