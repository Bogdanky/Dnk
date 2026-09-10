const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const STEAM_STORE = 'https://store.steampowered.com';

async function steamJson(url) {
    const response = await fetch(url, {
        headers: { 'User-Agent': 'DnkBot/1.0' }
    });
    if (!response.ok) throw new Error(`Steam returned ${response.status}`);
    return response.json();
}

async function getLowestPrice(appId) {
    try {
        // CheapShark oferă căutare directă după Steam App ID
        const response = await fetch(`https://www.cheapshark.com/api/1.0/games?steamAppID=${appId}`, {
            signal: AbortSignal.timeout(4000)
        });
        
        if (!response.ok) return 'Nedisponibil';
        
        const data = await response.json();
        // CheapShark returnează un array; luăm primul rezultat (meciul exact)
        if (data && data.length > 0 && data[0].cheapestPriceEver) {
            return `$${data[0].cheapestPriceEver.price}`;
        }
        
        return 'Nedisponibil';
    } catch (_) {
        return 'Nedisponibil';
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('game')
        .setDescription('Afișează detalii despre un joc Steam')
        .addStringOption(option => option
            .setName('nume')
            .setDescription('Numele jocului sau Steam App ID')
            .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const query = interaction.options.getString('nume', true).trim();

        try {
            const search = /^\d+$/.test(query)
                ? { id: Number(query) }
                : (await steamJson(`${STEAM_STORE}/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=us`)).items?.[0];

            if (!search) return interaction.editReply('Nu am găsit jocul pe Steam.');

            const appId = search.id;
            const response = await steamJson(`${STEAM_STORE}/api/appdetails?appids=${appId}&l=english&cc=us`);
            const game = response?.[appId]?.data;
            if (!response?.[appId]?.success || !game) {
                return interaction.editReply('Nu am putut obține detaliile jocului.');
            }

            let reviews = 'Nedisponibil';
            try {
                const reviewResponse = await steamJson(`${STEAM_STORE}/appreviews/${appId}?json=1&language=all&purchase_type=all`);
                const summary = reviewResponse.query_summary;
                if (summary?.total_reviews) {
                    reviews = `${summary.review_score_desc || 'Nespecificat'} — ${summary.total_positive.toLocaleString('ro-RO')}/${summary.total_reviews.toLocaleString('ro-RO')} pozitive`;
                }
            } catch (_) {
                // Reviews are optional; display the other game details if unavailable.
            }

            const price = game.is_free ? 'Gratuit' : (game.price_overview?.final_formatted || 'Nedisponibil');
            const pastPrice = game.is_free ? 'Gratuit' : await getLowestPrice(appId);
            const metascore = game.metacritic?.score ? `${game.metacritic.score}/100` : 'Nedisponibil';
            const description = (game.short_description || 'Fără descriere.')
                .replace(/<[^>]*>/g, '')
                .slice(0, 300);

            const embed = new EmbedBuilder()
                .setColor(0x1b2838)
                .setTitle(game.name)
                .setURL(`${STEAM_STORE}/app/${appId}`)
                .setDescription(description)
                .addFields(
                    { name: 'Preț', value: price, inline: true },
                    { name: 'Past price', value: pastPrice, inline: true },
                    { name: 'Reviews', value: reviews, inline: true },
                    { name: 'Metascore', value: metascore, inline: true }
                )
                .setThumbnail(game.header_image)
                .setFooter({ text: 'Date furnizate de Steam' });

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Steam game command:', error);
            return interaction.editReply('Steam nu a răspuns. Încearcă din nou mai târziu.');
        }
    }
};