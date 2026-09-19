const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { addTiktokWatch, removeTiktokWatch, getGuildWatches, setTiktokLastVideo } = require('../notify-store');
const { fetchLatestVideo } = require('../tiktok-watcher');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tiktok')
        .setDescription('Gestioneaza conturile TikTok urmarite pentru notificari de clipuri noi')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Adauga un cont TikTok de urmarit')
                .addStringOption(opt => opt.setName('username').setDescription('Username TikTok, fara @').setRequired(true))
                .addChannelOption(opt =>
                    opt.setName('canal_discord')
                        .setDescription('Unde sa anunt clipurile noi')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Elimina un cont TikTok urmarit')
                .addStringOption(opt => opt.setName('username').setDescription('Username TikTok').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('Lista conturilor TikTok urmarite pe acest server')),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (sub === 'list') {
            const { tiktok } = getGuildWatches(guildId);
            if (tiktok.length === 0) {
                return interaction.reply({ content: 'Niciun cont TikTok urmarit inca. Foloseste `/tiktok add`.', ephemeral: true });
            }
            const lines = tiktok.map(w => `@${w.username} → <#${w.discordChannelId}>`);
            return interaction.reply({ content: lines.join('\n'), ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        const username = interaction.options.getString('username', true).replace(/^@/, '').trim();

        if (sub === 'add') {
            const discordChannel = interaction.options.getChannel('canal_discord', true);

            const added = addTiktokWatch(guildId, username, discordChannel.id);
            if (!added) {
                return interaction.editReply('Contul asta e deja urmarit.');
            }

            const latest = await fetchLatestVideo(username).catch(() => null);
            setTiktokLastVideo(guildId, username, latest?.videoId ?? null);

            await interaction.editReply(
                `Am inceput sa urmaresc **@${username}**, anunt in ${discordChannel}. Te anunt doar la clipurile viitoare.\n` +
                `-# Foloseste citirea paginii publice TikTok (fara API oficial) - se poate opri sa functioneze daca TikTok blocheaza cererile sau isi schimba structura.`,
            );
        }

        if (sub === 'remove') {
            const removed = removeTiktokWatch(guildId, username);
            await interaction.editReply(removed ? 'Cont eliminat de la urmarire.' : 'Nu am gasit acel cont in lista urmarita.');
        }
    },
};
