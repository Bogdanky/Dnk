const fs = require('node:fs');
const path = require('node:path');

const dataDir = path.join(__dirname, 'data');
const storePath = path.join(dataDir, 'warns.json');

function loadAll() {
    try {
        const raw = fs.readFileSync(storePath, 'utf8');
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

function saveAll(data) {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
}

function getWarns(guildId, userId) {
    const all = loadAll();
    return all[guildId]?.[userId] ?? [];
}

function addWarn(guildId, userId, warn) {
    const all = loadAll();
    if (!all[guildId]) all[guildId] = {};
    if (!all[guildId][userId]) all[guildId][userId] = [];
    all[guildId][userId].push(warn);
    saveAll(all);
    return all[guildId][userId];
}

function removeWarn(guildId, userId, index) {
    const all = loadAll();
    const warns = all[guildId]?.[userId];
    if (!warns || index < 0 || index >= warns.length) return null;
    const [removed] = warns.splice(index, 1);
    saveAll(all);
    return removed;
}

module.exports = { getWarns, addWarn, removeWarn };
