const { EmbedBuilder } = require('discord.js');
const { getGuildWatches, setYoutubeLastVideo, setTiktokLastVideo, getAllGuildIdsWithWatches } = require('./notify-store');
const { fetchLatestVideo: fetchLatestYouTubeVideo } = require('./youtube-watcher');
const { fetchLatestVideo: fetchLatestTikTokVideo } = require('./tiktok-watcher');
const { getGuildWatches: getUtcnWatches, updateLastUrl: updateUtcnLastUrl, getAllGuildIdsWithWatches: getGuildIdsWithUtcnWatches } = require('./utcn-store');
const { fetchLatestAnnouncement } = require('./utcn-announcements');

async function checkYouTube(client, guildId) {
    const { youtube } = getGuildWatches(guildId);

    for (const watch of youtube) {
        try {
            const latest = await fetchLatestYouTubeVideo(watch.channelId);
            if (!latest) continue;

            if (watch.lastVideoId && latest.videoId !== watch.lastVideoId) {
                const channel = await client.channels.fetch(watch.discordChannelId).catch(() => null);
                if (channel) {
                    const embed = new EmbedBuilder()
                        .setTitle(latest.title)
                        .setURL(latest.url)
                        .setDescription(`📺 Video nou de la **${watch.channelName ?? latest.author ?? 'canal urmarit'}**!`)
                        .setColor(0xFF0000)
                        .setImage(latest.thumbnail)
                        .setTimestamp();
                    await channel.send({ embeds: [embed] }).catch(error => console.error('Eroare la trimiterea notificarii YouTube:', error));
                }
            }

            setYoutubeLastVideo(guildId, watch.channelId, latest.videoId);
        } catch (error) {
            console.error(`Eroare la verificarea canalului YouTube ${watch.channelId}:`, error);
        }
    }
}

async function checkTikTok(client, guildId) {
    const { tiktok } = getGuildWatches(guildId);

    for (const watch of tiktok) {
        try {
            const latest = await fetchLatestTikTokVideo(watch.username);
            if (!latest) continue;

            if (watch.lastVideoId && latest.videoId !== watch.lastVideoId) {
                const channel = await client.channels.fetch(watch.discordChannelId).catch(() => null);
                if (channel) {
                    const embed = new EmbedBuilder()
                        .setTitle((latest.description ?? 'Clip nou').slice(0, 256))
                        .setURL(latest.url)
                        .setDescription(`🎵 Clip nou de la **@${watch.username}**!`)
                        .setColor(0x00F2EA)
                        .setTimestamp();
                    if (latest.thumbnail) embed.setImage(latest.thumbnail);
                    await channel.send({ embeds: [embed] }).catch(error => console.error('Eroare la trimiterea notificarii TikTok:', error));
                }
            }

            setTiktokLastVideo(guildId, watch.username, latest.videoId);
        } catch (error) {
            console.error(`Eroare la verificarea contului TikTok @${watch.username}:`, error);
        }
    }
}

async function checkUTCN(client, guildId) {
    const watches = getUtcnWatches(guildId);

    for (const watch of watches) {
        try {
            const latest = await fetchLatestAnnouncement(watch.url);
            if (!latest) continue;

            if (watch.lastUrl && latest.url !== watch.lastUrl) {
                const channel = await client.channels.fetch(watch.discordChannelId).catch(() => null);
                if (channel) {
                    const embed = new EmbedBuilder()
                        .setTitle(latest.title)
                        .setURL(latest.url)
                        .setDescription(`📢 Anunt nou de la **${watch.name}**!`)
                        .setColor(0x0057B7)
                        .setFooter({ text: latest.date })
                        .setTimestamp();
                    await channel.send({ embeds: [embed] }).catch(error => console.error('Eroare la trimiterea notificarii UTCN:', error));
                }
            }

            updateUtcnLastUrl(guildId, watch.url, latest.url);
        } catch (error) {
            console.error(`Eroare la verificarea paginii UTCN ${watch.url}:`, error);
        }
    }
}

async function checkAllSocialUpdates(client) {
    for (const guildId of getAllGuildIdsWithWatches()) {
        await checkYouTube(client, guildId);
        await checkTikTok(client, guildId);
    }

    for (const guildId of getGuildIdsWithUtcnWatches()) {
        await checkUTCN(client, guildId);
    }
}

module.exports = { checkAllSocialUpdates };
