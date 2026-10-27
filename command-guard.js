'use strict';
async function requirePermission(interaction, permission, permissionLabel) {
    if (interaction.memberPermissions?.has(permission)) return true;
    await interaction.reply({
        content: `Nu ai permisiunea necesară pentru această acțiune: **${permissionLabel}**.`,
        ephemeral: true,
        allowedMentions: { parse: [] },
    });
    return false;
}
module.exports = { requirePermission };
