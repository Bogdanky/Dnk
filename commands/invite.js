const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1547574325744246825&permissions=3942816753776850&integration_type=0&scope=bot';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Arata link-ul de invitatie al botului'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('📨 Invita-ma pe alt server!')
            .setDescription('Apasa butonul de mai jos ca sa ma adaugi pe un alt server.')
            .setColor(0xFF9900);

        const button = new ButtonBuilder()
            .setLabel('Invita botul')
            .setStyle(ButtonStyle.Link)
            .setURL(INVITE_URL)
            .setEmoji('📨');

        const row = new ActionRowBuilder().addComponents(button);

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
