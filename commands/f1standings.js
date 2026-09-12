const { SlashCommandBuilder } = require('discord.js');
const { refreshStandingsMessage } = require('../f1-standings');

const ERROR_MESSAGES = {
    'not-configured': 'Nu e setat niciun canal pentru clasamentul F1. Un admin trebuie sa ruleze mai intai `/config f1-channel`.',
    'channel-not-found': 'Canalul configurat pentru clasamentul F1 nu mai exista sau nu am acces la el.',
    'fetch-failed': 'Nu am putut aduce datele de la API-ul F1 chiar acum. Mai incearca putin mai tarziu.',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('f1standings')
        .setDescription('Actualizeaza manual mesajul cu clasamentul F1 (sterge-l pe cel vechi, posteaza unul nou)'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const result = await refreshStandingsMessage(interaction.client, interaction.guild.id);

        if (!result.ok) {
            return interaction.editReply(ERROR_MESSAGES[result.reason] ?? 'A aparut o eroare necunoscuta.');
        }

        await interaction.editReply('Clasamentul F1 a fost actualizat.');
    },
};
