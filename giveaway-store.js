const path = require('node:path');
const { readJson, writeJsonAtomic } = require('./json-store');
const storePath = path.join(__dirname, 'data', 'giveaways.json');

function loadAll() { return readJson(storePath, {}); }
function saveAll(data) { writeJsonAtomic(storePath, data); }
function addGiveaway(messageId, giveaway) {
    const all = loadAll();
    all[messageId] = giveaway;
    saveAll(all);
}
function getGiveaway(messageId) {
    return loadAll()[messageId] || null;
}
function getAllGiveaways() { return loadAll(); }
function updateGiveaway(messageId, updates) {
    const all = loadAll();
    if (!all[messageId]) return null;
    all[messageId] = { ...all[messageId], ...updates };
    saveAll(all);
    return all[messageId];
}
module.exports = { addGiveaway, getGiveaway, getAllGiveaways, updateGiveaway };
