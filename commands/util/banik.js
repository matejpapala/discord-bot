const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'banik',
        description: 'Zobrazi posledni a nejblizsi zapasy FC Banik Ostrava',
    },

    async execute(interaction) {
        await interaction.deferReply();

        const apiKey = process.env.FLASHSCORE_API_KEY;

        if (!apiKey) {
            return await interaction.editReply('Nemas nastaveny FLASHSCORE_API_KEY v .env souboru.');
        }

        const headers = {
            'X-API-Key': apiKey
        };

        try {
            const resultsRes = await fetch('https://api.sportdb.dev/api/flashscore/football/czech-republic:62/chance-liga:hleea1wH/2025-2026/results', { headers });
            const resultsData = await resultsRes.json();

            const fixturesRes = await fetch('https://api.sportdb.dev/api/flashscore/football/czech-republic:62/chance-liga:hleea1wH/2025-2026/fixtures', { headers });
            const fixturesData = await fixturesRes.json();

            const banikEmbed = new EmbedBuilder()
                .setColor('#00529b')
                .setTitle('FC Banik Ostrava - Prehled zapasu')
                .setThumbnail('https://static.flashscore.com/res/image/data/61nYox73-KGvKypjo.png')
                .setTimestamp();

            let lastMatchesText = '';
            if (Array.isArray(resultsData)) {
                const banikResults = resultsData.filter(m => m.homeName === 'Ostrava' || m.awayName === 'Ostrava');
                banikResults.sort((a, b) => (b.startUtime || 0) - (a.startUtime || 0)); // Seradit od nejnovejsich
                const last2 = banikResults.slice(0, 2);

                if (last2.length > 0) {
                    for (const match of last2) {
                        const home = match.homeName || 'Neznamy';
                        const away = match.awayName || 'Neznamy';
                        const homeScore = match.homeScore ?? '-';
                        const awayScore = match.awayScore ?? '-';
                        const league = match.tournamentName || 'Chance Liga';

                        lastMatchesText += `*${league}*\n**${home} ${homeScore} : ${awayScore} ${away}**\n\n`;
                    }
                } else {
                    lastMatchesText = 'Zadne nedavne zapasy nenalezeny.';
                }
            } else {
                lastMatchesText = 'Chyba pri nacitani dat z ligy.';
            }

            banikEmbed.addFields({ name: 'Posledni odehrane zapasy', value: lastMatchesText });

            let nextMatchesText = '';
            if (Array.isArray(fixturesData)) {
                const banikFixtures = fixturesData.filter(m => m.homeName === 'Ostrava' || m.awayName === 'Ostrava');
                banikFixtures.sort((a, b) => (a.startUtime || 0) - (b.startUtime || 0));
                const next2 = banikFixtures.slice(0, 2);

                if (next2.length > 0) {
                    for (const match of next2) {
                        const home = match.homeName || 'Neznamy';
                        const away = match.awayName || 'Neznamy';
                        const league = match.tournamentName || 'Chance Liga';

                        let matchDate = 'Nezname datum';
                        if (match.startUtime) {
                            matchDate = new Date(match.startUtime * 1000).toLocaleDateString('cs-CZ', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            });
                        }

                        nextMatchesText += `**${matchDate}**\n*${league}*\n${home} vs ${away}\n\n`;
                    }
                } else {
                    nextMatchesText = 'Zadne naplanovane zapasy v dohledu.';
                }
            } else {
                nextMatchesText = 'Chyba pri nacitani dat z ligy.';
            }

            banikEmbed.addFields({ name: 'Nejblizsi zapasy', value: nextMatchesText });

            await interaction.editReply({ embeds: [banikEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('Nepodarilo se mi spojit s databazi Flashscore. Zkus to za chvili.');
        }
    }
};