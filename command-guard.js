'use strict';

/**
 * Runtime authorization is intentional even when a command declares default
 * permissions: administrators can change command access in Discord settings.
 * Call this before deferring or replying to an interaction.
 */
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
