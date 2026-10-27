const { validateUtcUrl } = require('./security');

async function fetchLatestAnnouncement(pageUrl) {
    const safeUrl = validateUtcUrl(pageUrl);
    const res = await fetch(safeUrl, {
        headers: { 'User-Agent': 'DnkBot/2.0 (+https://github.com/Bogdanky/Dnk)' },
        signal: AbortSignal.timeout(8000),
        redirect: 'error',
    });
    if (!res.ok) throw new Error(`Pagina de anunturi a raspuns cu status ${res.status}`);
    const contentLength = Number(res.headers.get('content-length') || 0);
    if (contentLength > 2_000_000) throw new Error('Pagina de anunturi este prea mare.');
    const html = await res.text();
    if (html.length > 2_000_000) throw new Error('Pagina de anunturi depaseste limita de 2 MB.');

    const dateRegex = /(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2})/g;
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
    const dates = [...html.matchAll(dateRegex)].map(m => ({ date: m[1], index: m.index }));
    const links = [...html.matchAll(linkRegex)].map(m => ({ url: m[1], title: m[2].trim(), index: m.index }));

    for (const d of dates) {
        const match = links.find(l => l.index > d.index && l.index < d.index + 600);
        if (!match) continue;
        let announcementUrl;
        try {
            announcementUrl = new URL(match.url, safeUrl);
            if (announcementUrl.protocol !== 'https:') continue;
        } catch { continue; }
        const host = announcementUrl.hostname.toLowerCase().replace(/\.$/, '');
        if (host !== 'utcluj.ro' && !host.endsWith('.utcluj.ro')) continue;
        return {
            date: d.date,
            title: match.title.replace(/\s+/g, ' ').slice(0, 256),
            url: announcementUrl.href,
        };
    }
    return null;
}

module.exports = { fetchLatestAnnouncement };
