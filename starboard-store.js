const path = require('node:path');
const { readJson, writeJsonAtomic } = require('./json-store');
const storePath = path.join(__dirname, 'data', 'starboard.json');

function loadAll() { return readJson(storePath, {}); }
function saveAll(data) { writeJsonAtomic(storePath, data); }
function getStarboardEntry(originalMessageId) { return loadAll()[originalMessageId] ?? null; }
function setStarboardEntry(originalMessageId, starboardMessageId) {
    const all = loadAll();
    all[originalMessageId] = starboardMessageId;
    saveAll(all);
}
function removeStarboardEntry(originalMessageId) {
    const all = loadAll();
    if (!(originalMessageId in all)) return false;
    delete all[originalMessageId];
    saveAll(all);
    return true;
}
module.exports = { getStarboardEntry, setStarboardEntry, removeStarboardEntry };
