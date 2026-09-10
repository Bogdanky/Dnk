const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('minecraft')
        .setDescription('Verifica statusul unui server Minecraft (Java Edition)')
        .addStringOption(option =>
            option.setName('adresa')
                .setDescription('Adresa serverului, ex: play.hypixel.net sau ip:port')
                .setRequired(true)),

    async execute(interaction) {
        const address = interaction.options.getString('adresa', true).trim();

        await interaction.deferReply();

        try {
            const response = await fetch(`https://api.mcstatus.io/v2/status/java/${encodeURIComponent(address)}`);

            if (!response.ok) {
                throw new Error(`API-ul mcstatus.io a raspuns cu status ${response.status}`);
            }

            const data = await response.json();

            if (!data.online) {
                return interaction.editReply(`❌ Serverul \`${address}\` este offline sau adresa nu e valida.`);
            }

            const embed = new EmbedBuilder()
                .setTitle(`Status server: ${data.host}`)
                .setColor(0x57F287)
                .addFields(
                    { name: 'Jucatori online', value: `${data.players?.online ?? '?'} / ${data.players?.max ?? '?'}`, inline: true },
                    { name: 'Versiune', value: data.version?.name_clean ?? 'Necunoscuta', inline: true },
                    { name: 'IP rezolvat', value: data.ip_address ?? 'Necunoscut', inline: true },
                );

            if (data.motd?.clean) {
                embed.setDescription(`\`\`\`${data.motd.clean}\`\`\``);
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Eroare la /minecraft:', error);
            await interaction.editReply('Nu am putut verifica acel server acum, mai incearca o data.');
        }
    },
};
