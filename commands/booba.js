const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

const LEGENDS = [
    'Lady Dimitrescu',
    'PepeBOOBA',
    'BOOBA',
    'BOOOBA',
    'BOOBAGE',
    'BOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOBA',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('booba')
        .setDescription('(Owner) Comanda secreta')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const ownerId = process.env.OWNER_ID;

        if (!ownerId || interaction.user.id !== ownerId) {
            return interaction.reply({ content: 'Nu ai acces la aceasta comanda.', ephemeral: true });
        }

        const legend = LEGENDS[Math.floor(Math.random() * LEGENDS.length)];

        const embed = new EmbedBuilder()
                .setTitle('🐱 Miauuuuuuuuuu!')
                .setImage(data.url)
                .setColor(0xFF9900);

            await interaction.editReply({ embeds: [embed] });
    },
};
