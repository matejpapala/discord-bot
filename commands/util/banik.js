const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'banik',
        description: 'Zobrazi posledni a nejblizsi zapasy FC Banik Ostrava',
    },

    async execute(interaction) {
        await interaction.deferReply();

        const apiKey = process.env.FOOTBALL_API_KEY;
        const teamId = 3713;

        if (!apiKey) {
            return await interaction.editReply('Nemas nastaveny FOOTBALL_API_KEY v .env souboru!');
        }

        const headers = {
            'x-apisports-key': apiKey
        };

        try {
            const lastRes = await fetch(`https://v3.football.api-sports.io/fixtures?team=${teamId}&last=2`, { headers });
            const lastData = await lastRes.json();

            const nextRes = await fetch(`https://v3.football.api-sports.io/fixtures?team=${teamId}&next=2`, { headers });
            const nextData = await nextRes.json();

            const banikEmbed = new EmbedBuilder()
                .setColor('#00529b')
                .setTitle('FC Banik Ostrava - Prehled zapasu')
                .setThumbnail(`https://media.api-sports.io/football/teams/${teamId}.png`)
                .setTimestamp();

            let lastMatchesText = '';
            if (lastData.response && lastData.response.length > 0) {
                for (const match of lastData.response.reverse()) {
                    const home = match.teams.home.name;
                    const away = match.teams.away.name;
                    const homeScore = match.goals.home;
                    const awayScore = match.goals.away;
                    const league = match.league.name;

                    const resultText = `**${home} ${homeScore} : ${awayScore} ${away}**`;
                    lastMatchesText += `*${league}*\n${resultText}\n\n`;
                }
            } else {
                lastMatchesText = 'Zadne nedavne zapasy nenalezeny.';
            }

            banikEmbed.addFields({ name: 'Posledni odehrane zapasy', value: lastMatchesText });

            let nextMatchesText = '';
            if (nextData.response && nextData.response.length > 0) {
                for (const match of nextData.response) {
                    const home = match.teams.home.name;
                    const away = match.teams.away.name;
                    const league = match.league.name;

                    const matchDate = new Date(match.fixture.date).toLocaleDateString('cs-CZ', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    });

                    nextMatchesText += `**${matchDate}**\n*${league}*\n${home} vs ${away}\n\n`;
                }
            } else {
                nextMatchesText = 'Zadne naplanovane zapasy v dohledu.';
            }

            banikEmbed.addFields({ name: 'Nejblizsi zapasy', value: nextMatchesText });

            await interaction.editReply({ embeds: [banikEmbed] });

        } catch (error) {
            console.error('Chyba pri stahovani fotbalu:', error);
            await interaction.editReply('Nepodarilo se mi spojit s fotbalovou databazi. Zkus to za chvili.');
        }
    }
};