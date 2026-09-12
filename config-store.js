const fs = require('node:fs');
const path = require('node:path');

const dataDir = path.join(__dirname, 'data');
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
        nsfwFilterEnabled: false,
        prefix: '!',
        logChannelId: null,
        welcomeChannelId: null,
        welcomeMessage: null,
        autoRoleId: null,
        starboardChannelId: null,
        starThreshold: 3,
        f1StandingsChannelId: null,
        f1StandingsMessageId: null,
        ...all[guildId],
    };
}

function setGuildConfig(guildId, updates) {
    const all = loadAll();
    all[guildId] = { ...all[guildId], ...updates };
    saveAll(all);
    return all[guildId];
}

function getAllGuildIds() {
    return Object.keys(loadAll());
}

module.exports = { getGuildConfig, setGuildConfig, getAllGuildIds };
