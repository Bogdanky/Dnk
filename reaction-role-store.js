const fs = require('node:fs');
const path = require('node:path');

const dataDir = path.join(__dirname, 'data');
const storePath = path.join(dataDir, 'reaction-roles.json');

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

// emojiKey: pentru emoji standard e chiar caracterul unicode (ex "🎮"),
// pentru emoji custom e ID-ul lui (ex "123456789012345678").
function addMapping(messageId, emojiKey, roleId) {
    const all = loadAll();
    if (!all[messageId]) all[messageId] = {};
    all[messageId][emojiKey] = roleId;
    saveAll(all);
}

function removeMapping(messageId, emojiKey) {
    const all = loadAll();
    if (!all[messageId]) return false;
    const existed = emojiKey in all[messageId];
    delete all[messageId][emojiKey];
    if (Object.keys(all[messageId]).length === 0) delete all[messageId];
    saveAll(all);
    return existed;
}

function getRoleForReaction(messageId, emojiKey) {
    const all = loadAll();
    return all[messageId]?.[emojiKey] ?? null;
}

function getMappingsForMessage(messageId) {
    const all = loadAll();
    return all[messageId] ?? {};
}

module.exports = { addMapping, removeMapping, getRoleForReaction, getMappingsForMessage };
