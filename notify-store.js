const path = require('node:path');
const { readJson, writeJsonAtomic } = require('./json-store');
const storePath = path.join(__dirname, 'data', 'notify-watches.json');
function loadAll() { return readJson(storePath, {}); }
function saveAll(data) { writeJsonAtomic(storePath, data); }
function getGuildWatches(guildId) {
    const all = loadAll();
    return all[guildId] ?? { youtube: [], tiktok: [] };
}
function addYoutubeWatch(guildId, channelId, channelName, discordChannelId) {
    const all = loadAll();
    if (!all[guildId]) all[guildId] = { youtube: [], tiktok: [] };
    if (all[guildId].youtube.some(w => w.channelId === channelId)) return false;
    all[guildId].youtube.push({ channelId, channelName, discordChannelId, lastVideoId: null });
    saveAll(all);
    return true;
}
function removeYoutubeWatch(guildId, channelId) {
    const all = loadAll();
    if (!all[guildId]) return false;
    const before = all[guildId].youtube.length;
    all[guildId].youtube = all[guildId].youtube.filter(w => w.channelId !== channelId);
    if (all[guildId].youtube.length < before) saveAll(all);
    return all[guildId].youtube.length < before;
}
function setYoutubeLastVideo(guildId, channelId, videoId) {
    const all = loadAll();
    const watch = all[guildId]?.youtube.find(w => w.channelId === channelId);
    if (watch) { watch.lastVideoId = videoId; saveAll(all); }
}
function addTiktokWatch(guildId, username, discordChannelId) {
    const all = loadAll();
    if (!all[guildId]) all[guildId] = { youtube: [], tiktok: [] };
    if (all[guildId].tiktok.some(w => w.username === username)) return false;
    all[guildId].tiktok.push({ username, discordChannelId, lastVideoId: null });
    saveAll(all);
    return true;
}
function removeTiktokWatch(guildId, username) {
    const all = loadAll();
    if (!all[guildId]) return false;
    const before = all[guildId].tiktok.length;
    all[guildId].tiktok = all[guildId].tiktok.filter(w => w.username !== username);
    if (all[guildId].tiktok.length < before) saveAll(all);
    return all[guildId].tiktok.length < before;
}
function setTiktokLastVideo(guildId, username, videoId) {
    const all = loadAll();
    const watch = all[guildId]?.tiktok.find(w => w.username === username);
    if (watch) { watch.lastVideoId = videoId; saveAll(all); }
}
function getAllGuildIdsWithWatches() { return Object.keys(loadAll()); }
module.exports = { getGuildWatches, addYoutubeWatch, removeYoutubeWatch, setYoutubeLastVideo, addTiktokWatch, removeTiktokWatch, setTiktokLastVideo, getAllGuildIdsWithWatches };
