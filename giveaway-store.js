const fs = require('node:fs');
const path = require('node:path');

const dataDir = path.join(__dirname, 'data');
const storePath = path.join(dataDir, 'giveaways.json');

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

function addGiveaway(messageId, giveaway) {
    const all = loadAll();
    all[messageId] = giveaway;
    saveAll(all);
}

function getGiveaway(messageId) {
    const all = loadAll();
    return all[messageId] || null;
}

function getAllGiveaways() {
    return loadAll();
}

function updateGiveaway(messageId, updates) {
    const all = loadAll();
    if (!all[messageId]) return null;
    all[messageId] = { ...all[messageId], ...updates };
    saveAll(all);
    return all[messageId];
}

module.exports = { addGiveaway, getGiveaway, getAllGiveaways, updateGiveaway };
