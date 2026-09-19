// Fiecare canal YouTube are un feed RSS public, nedocumentat oficial dar stabil de ani de zile,
// care nu necesita cheie API: https://www.youtube.com/feeds/videos.xml?channel_id=UCxxxxxxxx
// Parsam manual cu regex in loc sa adaugam o dependinta noua doar pentru un singur camp.

async function fetchLatestVideo(channelId) {
    const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
        signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
        throw new Error(`YouTube RSS a raspuns cu status ${response.status}`);
    }

    const xml = await response.text();

    // Primul <entry> din feed e mereu cel mai recent upload.
    const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/);
    if (!entryMatch) return null;

    const entry = entryMatch[1];
    const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1];
    const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const author = entry.match(/<name>(.*?)<\/name>/)?.[1];

    if (!videoId) return null;

    return {
        videoId,
        title: title ? decodeXmlEntities(title) : 'Video nou',
        author: author ? decodeXmlEntities(author) : null,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
}

function decodeXmlEntities(text) {
    return text
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'");
}

/**
 * Extrage un channel ID (UCxxxx) direct dintr-un URL de canal YouTube, daca e prezent in URL.
 * Pentru URL-uri cu @handle, care nu contin ID-ul direct, intoarce null - handle-urile
 * necesita fie API oficial (cu cheie), fie parsarea paginii HTML complete a canalului.
 */
function extractChannelIdFromUrl(input) {
    const directMatch = input.match(/UC[a-zA-Z0-9_-]{22}/);
    return directMatch ? directMatch[0] : null;
}

module.exports = { fetchLatestVideo, extractChannelIdFromUrl };
