const path = require('node:path');
const { readJson, writeJsonAtomic } = require('./json-store');

const dataDir = path.join(__dirname, 'data');
const configPath = path.join(dataDir, 'ticket-config.json');

function loadAll() {
    return readJson(configPath, {});
}
function saveAll(config) {
    writeJsonAtomic(configPath, config);
}
function getGuildConfig(guildId) {
    const all = loadAll();
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
