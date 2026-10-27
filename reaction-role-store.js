const path = require('node:path');
const { readJson, writeJsonAtomic } = require('./json-store');
const storePath = path.join(__dirname, 'data', 'reaction-roles.json');
function loadAll() { return readJson(storePath, {}); }
function saveAll(data) { writeJsonAtomic(storePath, data); }
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
    if (existed) saveAll(all);
    return existed;
}
function getRoleForReaction(messageId, emojiKey) { return loadAll()[messageId]?.[emojiKey] ?? null; }
function getMappingsForMessage(messageId) { return loadAll()[messageId] ?? {}; }
module.exports = { addMapping, removeMapping, getRoleForReaction, getMappingsForMessage };
