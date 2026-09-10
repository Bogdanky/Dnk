const fs = require('node:fs');
const path = require('node:path');

const dataDir = path.join(__dirname, '..', 'data');
const configPath = path.join(dataDir, 'ticket-config.json');

function loadAll() {
    try {
        const raw = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

function saveAll(config) {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function getGuildConfig(guildId) {
    const all = loadAll();
    // Fallback pe .env, util doar daca cineva a facut deja setup manual acolo si nu a rulat inca /ticket setup.
    return {
        modRoleId: process.env.MOD_ROLE_ID || null,
        categoryId: process.env.TICKET_CATEGORY_ID || null,
        ...all[guildId],
    };
}

function setGuildConfig(guildId, updates) {
    const all = loadAll();
    all[guildId] = { ...all[guildId], ...updates };
    saveAll(all);
    return all[guildId];
}

module.exports = { getGuildConfig, setGuildConfig };
