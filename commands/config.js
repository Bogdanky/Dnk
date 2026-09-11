const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { setGuildConfig, getGuildConfig } = require('../config-store');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configurari generale ale botului pentru acest server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('welcome')
                .setDescription('Seteaza mesajul de bun venit pentru membri noi')
                .addChannelOption(opt =>
                    opt.setName('canal')
                        .setDescription('Canalul unde se trimite mesajul de bun venit')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true))
                .addStringOption(opt =>
                    opt.setName('mesaj')
                        .setDescription('Mesajul. Foloseste {user} pentru mentiune si {server} pentru numele serverului')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('autorole')
                .setDescription('Seteaza un rol atribuit automat membrilor noi')
                .addRoleOption(opt => opt.setName('rol').setDescription('Rolul de atribuit automat').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('autorole-disable')
                .setDescription('Dezactiveaza atribuirea automata de rol'))
        .addSubcommand(sub =>
            sub.setName('log-channel')
                .setDescription('Seteaza canalul unde se trimit log-urile de moderare')
                .addChannelOption(opt =>
                    opt.setName('canal')
                        .setDescription('Canalul de logging')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('starboard')
                .setDescription('Configureaza starboard-ul')
                .addChannelOption(opt =>
                    opt.setName('canal')
                        .setDescription('Canalul unde se posteaza mesajele populare')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true))
                .addIntegerOption(opt =>
                    opt.setName('prag')
                        .setDescription('Cate reactii ⭐ sunt necesare (implicit 3)')
                        .setMinValue(1)
                        .setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('prefix')
                .setDescription('Seteaza prefixul alternativ pentru comenzi (ex: !)')
                .addStringOption(opt =>
                    opt.setName('text')
                        .setDescription('Noul prefix, maxim 3 caractere (ex: !, ?, b!)')
                        .setRequired(true)
                        .setMaxLength(3)))
        .addSubcommand(sub =>
            sub.setName('show')
                .setDescription('Arata configuratia curenta a botului pentru acest server')),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (sub === 'welcome') {
            const channel = interaction.options.getChannel('canal', true);
            const message = interaction.options.getString('mesaj', true);
            setGuildConfig(guildId, { welcomeChannelId: channel.id, welcomeMessage: message });
            return interaction.reply({ content: `Mesaj de bun venit setat in ${channel}.`, ephemeral: true });
        }

        if (sub === 'autorole') {
            const role = interaction.options.getRole('rol', true);
            setGuildConfig(guildId, { autoRoleId: role.id });
            return interaction.reply({ content: `Rolul automat setat: ${role}.`, ephemeral: true });
        }

        if (sub === 'autorole-disable') {
            setGuildConfig(guildId, { autoRoleId: null });
            return interaction.reply({ content: 'Atribuirea automata de rol a fost dezactivata.', ephemeral: true });
        }

        if (sub === 'log-channel') {
            const channel = interaction.options.getChannel('canal', true);
            setGuildConfig(guildId, { logChannelId: channel.id });
            return interaction.reply({ content: `Canalul de log setat: ${channel}.`, ephemeral: true });
        }

        if (sub === 'starboard') {
            const channel = interaction.options.getChannel('canal', true);
            const threshold = interaction.options.getInteger('prag') ?? 3;
            setGuildConfig(guildId, { starboardChannelId: channel.id, starThreshold: threshold });
            return interaction.reply({ content: `Starboard setat pe ${channel}, prag: ${threshold} reactii ⭐.`, ephemeral: true });
        }

        if (sub === 'prefix') {
            const text = interaction.options.getString('text', true);
            setGuildConfig(guildId, { prefix: text });
            return interaction.reply({ content: `Prefixul alternativ e acum: \`${text}\``, ephemeral: true });
        }

        if (sub === 'show') {
            const config = getGuildConfig(guildId);
            const embed = new EmbedBuilder()
                .setTitle('Configuratia curenta')
                .setColor(0xFF9900)
                .addFields(
                    { name: 'Prefix', value: `\`${config.prefix}\``, inline: true },
                    { name: 'Rol moderator tichete', value: config.modRoleId ? `<@&${config.modRoleId}>` : 'nesetat', inline: true },
                    { name: 'Categorie tichete', value: config.categoryId ? `<#${config.categoryId}>` : 'nesetata', inline: true },
                    { name: 'Filtru NSFW', value: config.nsfwFilterEnabled ? 'activ' : 'oprit', inline: true },
                    { name: 'Canal welcome', value: config.welcomeChannelId ? `<#${config.welcomeChannelId}>` : 'nesetat', inline: true },
                    { name: 'Autorole', value: config.autoRoleId ? `<@&${config.autoRoleId}>` : 'nesetat', inline: true },
                    { name: 'Canal log', value: config.logChannelId ? `<#${config.logChannelId}>` : 'nesetat', inline: true },
                    { name: 'Starboard', value: config.starboardChannelId ? `<#${config.starboardChannelId}> (prag ${config.starThreshold})` : 'nesetat', inline: true },
                );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
