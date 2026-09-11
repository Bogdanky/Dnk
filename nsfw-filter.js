const RAPIDAPI_HOST = 'nsfw3.p.rapidapi.com';
const THRESHOLD = 0.85; // scor de la 0 la 1; peste asta consideram imaginea NSFW

/**
 * Verifica o imagine (prin URL) folosind API-ul api4ai/nsfw3 de pe RapidAPI.
 * Returneaza true daca e considerata NSFW, false daca nu, sau null daca nu avem cheie API.
 */
async function isImageNsfw(imageUrl) {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) return null;

    const form = new FormData();
    form.append('url', imageUrl);

    const response = await fetch(`https://${RAPIDAPI_HOST}/v1/results?strictness=1.0`, {
        method: 'POST',
        headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': RAPIDAPI_HOST,
        },
        body: form,
    });

    if (!response.ok) {
        throw new Error(`API-ul NSFW a raspuns cu status ${response.status}`);
    }

    const data = await response.json();
    const result = data?.results?.[0];

    if (result?.status?.code !== 'ok') {
        throw new Error(result?.status?.message || 'Raspuns necunoscut de la API-ul NSFW');
    }

    const nsfwScore = result.entities?.[0]?.classes?.nsfw ?? 0;
    return nsfwScore >= THRESHOLD;
}

module.exports = { isImageNsfw, THRESHOLD };
