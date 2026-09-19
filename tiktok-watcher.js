// ATENTIE: TikTok nu are un feed RSS public ca YouTube si nu ofera un API gratuit
// pentru "ultimul video al unui user". Singura metoda fara cheie API platita e sa
// citim direct din pagina publica a profilului un bloc JSON pe care TikTok il
// foloseste intern pentru randare (React hydration data), ascuns intr-un <script>.
//
// E o metoda cunoscuta si documentata, dar NEOFICIALA:
// - TikTok poate bloca cereri automate (mai ales de pe IP-uri de hosting/cloud)
// - Structura paginii se poate schimba oricand, fara avertisment
// - Daca incepe sa dea erori frecvent, solutia reala e un serviciu platit
//   (ex: un scraper de pe RapidAPI sau Apify) - asta necesita o cheie API si cost.

async function fetchLatestVideo(username) {
    const cleanUsername = username.replace(/^@/, '');

    const response = await fetch(`https://www.tiktok.com/@${cleanUsername}`, {
        signal: AbortSignal.timeout(10000),
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        },
    });

    if (!response.ok) {
        throw new Error(`TikTok a raspuns cu status ${response.status} (posibil blocat sau profil inexistent)`);
    }

    const html = await response.text();
    const match = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);

    if (!match) {
        throw new Error('Nu am gasit datele asteptate in pagina - TikTok si-a schimbat probabil structura sau ne-a blocat.');
    }

    let data;
    try {
        data = JSON.parse(match[1]);
    } catch {
        throw new Error('Datele gasite pe pagina nu au putut fi interpretate (JSON invalid).');
    }

    const userDetail = data?.__DEFAULT_SCOPE__?.['webapp.user-detail'];
    const items = userDetail?.userInfo?.itemList ?? userDetail?.itemList;

    // Fallback: unele conturi returneaza lista de video-uri intr-o alta cheie de scope.
    const videoList = items ?? findFirstItemList(data);

    if (!videoList || videoList.length === 0) {
        return null; // cont fara video-uri publice, sau layout neasteptat
    }

    const latest = videoList[0];

    return {
        videoId: latest.id,
        description: latest.desc || '(fara descriere)',
        url: `https://www.tiktok.com/@${cleanUsername}/video/${latest.id}`,
        thumbnail: latest.video?.cover || latest.video?.originCover || null,
    };
}

function findFirstItemList(data) {
    const scopes = data?.__DEFAULT_SCOPE__ ?? {};
    for (const key of Object.keys(scopes)) {
        const candidate = scopes[key]?.itemList;
        if (Array.isArray(candidate) && candidate.length > 0) return candidate;
    }
    return null;
}

module.exports = { fetchLatestVideo };
