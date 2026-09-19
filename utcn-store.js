const fs = require('node:fs');
const path = require('node:path');

const dataDir = path.join(__dirname, 'data');
const storePath = path.join(dataDir, 'utcn-watches.json');

function loadAll() {
    try {
        return JSON.parse(fs.readFileSync(storePath, 'utf8'));
    } catch {
        return {};
    }
}

function saveAll(data) {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
}

function getGuildWatches(guildId) {
    const all = loadAll();
    return all[guildId] ?? [];
}

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
    saveAll(all);
    return all[guildId].length < before;
}

function updateLastUrl(guildId, url, lastUrl) {
    const all = loadAll();
    const entry = all[guildId]?.find(w => w.url === url);
    if (entry) {
        entry.lastUrl = lastUrl;
        saveAll(all);
    }
}

function getAllGuildIdsWithWatches() {
    return Object.keys(loadAll());
}

module.exports = { getGuildWatches, addWatch, removeWatch, updateLastUrl, getAllGuildIdsWithWatches };
