const path = require('node:path');
const { readJson, writeJsonAtomic } = require('./json-store');
const storePath = path.join(__dirname, 'data', 'utcn-watches.json');
function loadAll() { return readJson(storePath, {}); }
function saveAll(data) { writeJsonAtomic(storePath, data); }
function getGuildWatches(guildId) { return loadAll()[guildId] ?? []; }
function addWatch(guildId, { url, name, discordChannelId, lastUrl }) {
    const all = loadAll();
    if (!all[guildId]) all[guildId] = [];
    if (all[guildId].some(w => w.url === url)) return false;
    all[guildId].push({ url, name, discordChannelId, lastUrl: lastUrl ?? null });
    saveAll(all);
    return true;
}
function removeWatch(guildId, url) {
    const all = loadAll();
    if (!all[guildId]) return false;
    const before = all[guildId].length;
    all[guildId] = all[guildId].filter(w => w.url !== url);
    if (all[guildId].length < before) saveAll(all);
    return all[guildId].length < before;
}
function updateLastUrl(guildId, url, lastUrl) {
    const all = loadAll();
    const entry = all[guildId]?.find(w => w.url === url);
    if (entry) { entry.lastUrl = lastUrl; saveAll(all); }
}
function getAllGuildIdsWithWatches() { return Object.keys(loadAll()); }
module.exports = { getGuildWatches, addWatch, removeWatch, updateLastUrl, getAllGuildIdsWithWatches };
