const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { addWatch, removeWatch, getGuildWatches } = require('../utcn-store');
const { fetchLatestAnnouncement } = require('../utcn-announcements');
const { validateUtcUrl } = require('../security');
const { requirePermission } = require('../command-guard');

const PRESET_PAGES = {
    'inginerie-electrica': { url: 'https://ie.utcluj.ro/anunturi.html', name: 'Facultatea de Inginerie Electrica' },
    etti: { url: 'https://etti.utcluj.ro/anunturi.html', name: 'ETTI' },
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('utcn')
        .setDescription('Notificari pentru anunturile de pe site-urile facultatilor UTCN')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub.setName('add').setDescription('Urmareste o pagina de anunturi UTCN')
            .addChannelOption(opt => opt.setName('canal_discord').setDescription('Unde sa anunt anunturile noi').addChannelTypes(ChannelType.GuildText).setRequired(true))
            .addStringOption(opt => opt.setName('facultate').setDescription('Facultate predefinita sau foloseste url_custom')
                .addChoices({ name: 'Inginerie Electrica (ie.utcluj.ro)', value: 'inginerie-electrica' }, { name: 'ETTI (etti.utcluj.ro)', value: 'etti' }).setRequired(false))
            .addStringOption(opt => opt.setName('url_custom').setDescription('URL HTTPS de pe domeniul oficial utcluj.ro').setRequired(false)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Elimina o pagina urmarita')
            .addStringOption(opt => opt.setName('url').setDescription('URL-ul paginii - vezi /utcn list').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('Lista paginilor de anunturi urmarite')),

    async execute(interaction) {
        if (!await requirePermission(interaction, PermissionFlagsBits.Administrator, 'Administrator')) return;
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (sub === 'list') {
            const watches = getGuildWatches(guildId);
            if (watches.length === 0) return interaction.reply({ content: 'Nicio pagina de anunturi urmarita inca. Foloseste `/utcn add`.', ephemeral: true });
            return interaction.reply({ content: watches.map(w => `**${w.name}** — \`${w.url}\` → <#${w.discordChannelId}>`).join('\n').slice(0, 1900), ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        if (sub === 'add') {
            const preset = interaction.options.getString('facultate');
            const customUrl = interaction.options.getString('url_custom');
            const discordChannel = interaction.options.getChannel('canal_discord', true);
            let url, name;

            if (preset && PRESET_PAGES[preset]) {
                ({ url, name } = PRESET_PAGES[preset]);
            } else if (customUrl) {
                try {
                    url = validateUtcUrl(customUrl.trim()).href;
                    name = new URL(url).hostname;
                } catch (error) {
                    return interaction.editReply(error.message || 'URL invalid.');
                }
            } else {
                return interaction.editReply('Alege o facultate din lista sau da un URL HTTPS de pe domeniul oficial utcluj.ro.');
            }

            let latest;
            try { latest = await fetchLatestAnnouncement(url); }
            catch (error) {
                console.error('Eroare la /utcn add:', error);
                return interaction.editReply('Nu am putut incarca pagina de anunturi. Verifica URL-ul oficial si incearca din nou.');
            }

            const added = addWatch(guildId, { url, name, discordChannelId: discordChannel.id, lastUrl: latest?.url ?? null });
            if (!added) return interaction.editReply('Pagina asta e deja urmarita.');
            return interaction.editReply(`Am inceput sa urmaresc anunturile de la **${name}**, anunt in ${discordChannel}. Te anunt doar la anunturile viitoare.`);
        }

        if (sub === 'remove') {
            let url;
            try { url = validateUtcUrl(interaction.options.getString('url', true).trim()).href; }
            catch { return interaction.editReply('URL invalid. Foloseste exact URL-ul din comanda `/utcn list`.'); }
            const removed = removeWatch(guildId, url);
            return interaction.editReply(removed ? 'Pagina eliminata de la urmarire.' : 'Nu am gasit acea pagina in lista urmarita.');
        }
    },
};
