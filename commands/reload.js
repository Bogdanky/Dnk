const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('(Dev) Reincarca o comanda fara sa repornesti botul')
        .addStringOption(option =>
            option.setName('comanda')
                .setDescription('Numele comenzii de reincarcat (ex: 8ball, poll, meme)')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Doar owner-ul botului poate folosi /reload, ca sa nu umble oricine pe server cu asta.
        const ownerId = process.env.OWNER_ID;
        if (ownerId && interaction.user.id !== ownerId) {
            return interaction.reply({ content: 'Doar owner-ul botului poate folosi aceasta comanda.', ephemeral: true });
        }

        const commandName = interaction.options.getString('comanda', true).toLowerCase();
        const oldCommand = interaction.client.commands.get(commandName);

        if (!oldCommand) {
            return interaction.reply({
                content: `Nu exista nicio comanda incarcata cu numele \`${commandName}\`.`,
                ephemeral: true,
            });
        }

        try {
            // Stergem modulul din cache-ul Node, ca sa forteze re-citirea fisierului de pe disc.
            delete require.cache[require.resolve(oldCommand.filePath)];

            const newCommand = require(oldCommand.filePath);
            newCommand.filePath = oldCommand.filePath;

            interaction.client.commands.set(newCommand.data.name, newCommand);

            await interaction.reply({
                content: `Comanda \`${newCommand.data.name}\` a fost reincarcata cu succes.`,
                ephemeral: true,
            });
        } catch (error) {
            console.error(`Eroare la reincarcarea comenzii ${commandName}:`, error);
            await interaction.reply({
                content: `A aparut o eroare la reincarcare: \`${error.message}\``,
                ephemeral: true,
            });
        }
    },
};
