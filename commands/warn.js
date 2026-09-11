const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getWarns, addWarn, removeWarn } = require('../warn-store');
const { sendLog, baseEmbed } = require('../audit-log');

const AUTO_KICK_THRESHOLD = 3;

async function warnAdd(interaction) {
    const target = interaction.options.getUser('membru', true);
    const reason = interaction.options.getString('motiv', true);

    if (target.id === interaction.user.id) {
        return interaction.reply({ content: 'Nu te poti avertiza singur.', ephemeral: true });
    }

    const warns = addWarn(interaction.guild.id, target.id, {
        reason,
        moderatorId: interaction.user.id,
        timestamp: Date.now(),
    });

    await interaction.reply({
        content: `⚠️ ${target} a primit un avertisment (${warns.length}/${AUTO_KICK_THRESHOLD}).\n**Motiv:** ${reason}`,
    });

    await sendLog(interaction.client, interaction.guild.id, baseEmbed('⚠️ Avertisment nou', 0xFEE75C)
        .addFields(
            { name: 'Membru', value: `${target} (${target.id})` },
            { name: 'Moderator', value: `${interaction.user}` },
            { name: 'Motiv', value: reason },
            { name: 'Total avertismente', value: `${warns.length}` },
        ));

    if (warns.length >= AUTO_KICK_THRESHOLD) {
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        if (member?.kickable) {
            await member.kick(`Auto-kick: a atins ${AUTO_KICK_THRESHOLD} avertismente`);
            await interaction.followUp(`🥾 ${target} a atins ${AUTO_KICK_THRESHOLD} avertismente si a fost dat afara automat.`);
            await sendLog(interaction.client, interaction.guild.id, baseEmbed('🥾 Kick automat', 0xED4245)
                .addFields({ name: 'Membru', value: `${target} (${target.id})` }, { name: 'Motiv', value: `A atins ${AUTO_KICK_THRESHOLD} avertismente` }));
        } else {
            await interaction.followUp(`${target} a atins ${AUTO_KICK_THRESHOLD} avertismente, dar nu am putut sa-l dau afara (verifica permisiunile/ierarhia rolurilor botului).`);
        }
    }
}

async function warnList(interaction) {
    const target = interaction.options.getUser('membru', true);
    const warns = getWarns(interaction.guild.id, target.id);

    if (warns.length === 0) {
        return interaction.reply({ content: `${target} nu are niciun avertisment.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle(`Avertismente pentru ${target.tag}`)
        .setColor(0xFEE75C)
        .setDescription(
            warns.map((w, i) => `**#${i}** - <@${w.moderatorId}> - <t:${Math.floor(w.timestamp / 1000)}:R>\n${w.reason}`).join('\n\n'),
        );

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function warnRemove(interaction) {
    const target = interaction.options.getUser('membru', true);
    const index = interaction.options.getInteger('index', true);

    const removed = removeWarn(interaction.guild.id, target.id, index);

    if (!removed) {
        return interaction.reply({ content: `Nu exista un avertisment cu indexul ${index} pentru ${target}.`, ephemeral: true });
    }

    await interaction.reply({ content: `Am sters avertismentul #${index} al lui ${target} ("${removed.reason}").`, ephemeral: true });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Sistem de avertismente pentru membri')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Adauga un avertisment unui membru')
                .addUserOption(opt => opt.setName('membru').setDescription('Membrul avertizat').setRequired(true))
                .addStringOption(opt => opt.setName('motiv').setDescription('Motivul avertismentului').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('Arata toate avertismentele unui membru')
                .addUserOption(opt => opt.setName('membru').setDescription('Membrul de verificat').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Sterge un avertisment specific')
                .addUserOption(opt => opt.setName('membru').setDescription('Membrul').setRequired(true))
                .addIntegerOption(opt => opt.setName('index').setDescription('Indexul avertismentului (vezi /warn list)').setRequired(true).setMinValue(0))),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        if (sub === 'add') return warnAdd(interaction);
        if (sub === 'list') return warnList(interaction);
        if (sub === 'remove') return warnRemove(interaction);
    },
};
