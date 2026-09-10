const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jumbo')
        .setDescription('Afiseaza un emoji custom marit')
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('Emoji-ul custom de marit (nu unul standard)')
                .setRequired(true)),

    async execute(interaction) {
        const input = interaction.options.getString('emoji', true).trim();
        const match = input.match(/<(a?):(\w+):(\d+)>/);

        if (!match) {
            return interaction.reply({
                content: 'Nu am recunoscut niciun emoji custom acolo. Foloseste un emoji custom de pe un server (nu un emoji standard Unicode).',
                ephemeral: true,
            });
        }

        const [, animatedFlag, name, id] = match;
        const extension = animatedFlag ? 'gif' : 'png';
        const url = `https://cdn.discordapp.com/emojis/${id}.${extension}?size=512`;

        const embed = new EmbedBuilder()
            .setTitle(`:${name}:`)
            .setImage(url)
            .setColor(0xFF9900);

        await interaction.reply({ embeds: [embed] });
    },
};
