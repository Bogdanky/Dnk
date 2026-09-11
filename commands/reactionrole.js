const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { addMapping, removeMapping, getMappingsForMessage } = require('../reaction-role-store');

function parseEmojiKey(input) {
    const customMatch = input.trim().match(/^<a?:\w+:(\d+)>$/);
    if (customMatch) return customMatch[1];
    return input.trim(); // emoji unicode standard, folosit ca atare
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Configureaza roluri atribuite prin reactie la un mesaj')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Adauga o mapare emoji -> rol pe un mesaj')
                .addStringOption(opt => opt.setName('mesaj_id').setDescription('ID-ul mesajului').setRequired(true))
                .addStringOption(opt => opt.setName('emoji').setDescription('Emoji-ul (standard sau custom)').setRequired(true))
                .addRoleOption(opt => opt.setName('rol').setDescription('Rolul de atribuit').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Sterge o mapare emoji -> rol de pe un mesaj')
                .addStringOption(opt => opt.setName('mesaj_id').setDescription('ID-ul mesajului').setRequired(true))
                .addStringOption(opt => opt.setName('emoji').setDescription('Emoji-ul de sters').setRequired(true))),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const messageId = interaction.options.getString('mesaj_id', true);
        const emojiInput = interaction.options.getString('emoji', true);
        const emojiKey = parseEmojiKey(emojiInput);

        const message = await interaction.channel.messages.fetch(messageId).catch(() => null);
        if (!message) {
            return interaction.reply({
                content: 'Nu am gasit acel mesaj in acest canal. Ruleaza comanda din canalul unde e mesajul.',
                ephemeral: true,
            });
        }

        if (sub === 'add') {
            const role = interaction.options.getRole('rol', true);

            const botMember = await interaction.guild.members.fetchMe();
            if (role.position >= botMember.roles.highest.position) {
                return interaction.reply({
                    content: `Nu pot atribui rolul ${role} - e mai sus (sau la fel de sus) decat rolul botului.`,
                    ephemeral: true,
                });
            }

            try {
                await message.react(emojiInput);
            } catch {
                return interaction.reply({
                    content: 'Nu am putut reactiona cu acel emoji. Verifica ca l-ai scris corect (copiaza-l direct din Discord).',
                    ephemeral: true,
                });
            }

            addMapping(messageId, emojiKey, role.id);
            await interaction.reply({ content: `Gata: cine reactioneaza cu ${emojiInput} pe acel mesaj primeste rolul ${role}.`, ephemeral: true });
        }

        if (sub === 'remove') {
            const existed = removeMapping(messageId, emojiKey);
            if (!existed) {
                return interaction.reply({ content: 'Nu exista o mapare cu acel emoji pe acel mesaj.', ephemeral: true });
            }
            await interaction.reply({ content: `Am sters maparea pentru ${emojiInput} de pe acel mesaj.`, ephemeral: true });
        }
    },
};
