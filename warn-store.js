const path = require('node:path');
const { readJson, writeJsonAtomic } = require('./json-store');

const storePath = path.join(__dirname, 'data', 'warns.json');
function loadAll() { return readJson(storePath, {}); }
function saveAll(data) { writeJsonAtomic(storePath, data); }

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
