/**
 * Site-urile facultatilor UTCN (Contao CMS) nu au RSS - facem parsare directa a paginii
 * de anunturi. Abordare pozitionala (data urmata de primul link gasit dupa ea), ca sa nu
 * depindem de clase CSS specifice care pot sa difere intre facultati sau sa se schimbe
 * la un update al site-ului.
 */
async function fetchLatestAnnouncement(pageUrl) {
    const res = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`Pagina de anunturi a raspuns cu status ${res.status}`);

    const html = await res.text();

    const dateRegex = /(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2})/g;
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g;

    const dates = [...html.matchAll(dateRegex)].map(m => ({ date: m[1], index: m.index }));
    const links = [...html.matchAll(linkRegex)].map(m => ({ url: m[1], title: m[2].trim(), index: m.index }));

    for (const d of dates) {
        // primul link care apare in cel mult ~600 caractere dupa data respectiva
        const match = links.find(l => l.index > d.index && l.index < d.index + 600);
        if (match) {
            return {
                date: d.date,
                title: match.title,
                url: match.url.startsWith('http') ? match.url : new URL(match.url, pageUrl).href,
            };
        }
    }

    return null;
}

module.exports = { fetchLatestAnnouncement };
