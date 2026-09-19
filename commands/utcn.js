const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { addWatch, removeWatch, getGuildWatches } = require('../utcn-store');
const { fetchLatestAnnouncement } = require('../utcn-announcements');

const PRESET_PAGES = {
    'inginerie-electrica': { url: 'https://ie.utcluj.ro/anunturi.html', name: 'Facultatea de Inginerie Electrica' },
    etti: { url: 'https://etti.utcluj.ro/anunturi.html', name: 'ETTI' },
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('utcn')
        .setDescription('Notificari pentru anunturile de pe site-urile facultatilor UTCN')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Urmareste o pagina de anunturi UTCN')
                .addChannelOption(opt =>
                    opt.setName('canal_discord')
                        .setDescription('Unde sa anunt anunturile noi')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true))
                .addStringOption(opt =>
                    opt.setName('facultate')
                        .setDescription('Alege o facultate predefinita, sau lasa gol si foloseste url_custom')
                        .addChoices(
                            { name: 'Inginerie Electrica (ie.utcluj.ro)', value: 'inginerie-electrica' },
                            { name: 'ETTI (etti.utcluj.ro)', value: 'etti' },
                        )
                        .setRequired(false))
                .addStringOption(opt => opt.setName('url_custom').setDescription('URL complet catre alta pagina de anunturi UTCN').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Elimina o pagina urmarita')
                .addStringOption(opt => opt.setName('url').setDescription('URL-ul paginii - vezi /utcn list').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('Lista paginilor de anunturi urmarite')),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (sub === 'list') {
            const watches = getGuildWatches(guildId);
            if (watches.length === 0) {
                return interaction.reply({ content: 'Nicio pagina de anunturi urmarita inca. Foloseste `/utcn add`.', ephemeral: true });
            }
            const lines = watches.map(w => `**${w.name}** — \`${w.url}\` → <#${w.discordChannelId}>`);
            return interaction.reply({ content: lines.join('\n'), ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        if (sub === 'add') {
            const preset = interaction.options.getString('facultate');
            const customUrl = interaction.options.getString('url_custom');
            const discordChannel = interaction.options.getChannel('canal_discord', true);

            let url, name;
            if (preset) {
                ({ url, name } = PRESET_PAGES[preset]);
            } else if (customUrl) {
                url = customUrl.trim();
                try {
                    name = new URL(url).hostname;
                } catch {
                    return interaction.editReply('URL-ul dat nu e valid.');
                }
            } else {
                return interaction.editReply('Alege o facultate din lista `facultate`, sau da un URL cu `url_custom`.');
            }

            let latest;
            try {
                latest = await fetchLatestAnnouncement(url);
            } catch (error) {
                console.error('Eroare la /utcn add:', error);
                return interaction.editReply('Nu am putut incarca acea pagina de anunturi. Verifica URL-ul si ca pagina e accesibila.');
            }

            const added = addWatch(guildId, { url, name, discordChannelId: discordChannel.id, lastUrl: latest?.url ?? null });
            if (!added) {
                return interaction.editReply('Pagina asta e deja urmarita.');
            }

            await interaction.editReply(
                `Am inceput sa urmaresc anunturile de la **${name}**, anunt in ${discordChannel}. ` +
                `Te anunt doar la anunturile viitoare, nu la cele deja existente.\n` +
                `-# Site-ul UTCN nu are RSS oficial - citesc pagina direct, ce se poate opri sa functioneze daca isi schimba structura HTML.`,
            );
        }

        if (sub === 'remove') {
            const url = interaction.options.getString('url', true).trim();
            const removed = removeWatch(guildId, url);
            await interaction.editReply(removed ? 'Pagina eliminata de la urmarire.' : 'Nu am gasit acea pagina in lista urmarita.');
        }
    },
};
