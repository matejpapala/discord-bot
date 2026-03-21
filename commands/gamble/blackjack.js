const db = require('../../database.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');

function createDeck() {
    const suits = ['Piky', 'Srdce', 'Kary', 'Krize'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let deck = [];

    for (let suit of suits) {
        for (let value of values) {
            let weight = parseInt(value);
            if (['J', 'Q', 'K'].includes(value)) weight = 10;
            if (value === 'A') weight = 11;
            deck.push({ suit, value, weight, name: `${value} ${suit}` });
        }
    }
    return deck.sort(() => Math.random() - 0.5);
}

function calculateScore(cards) {
    let score = 0;
    let aces = 0;

    for (let card of cards) {
        score += card.weight;
        if (card.value === 'A') aces += 1;
    }

    while (score > 21 && aces > 0) {
        score -= 10;
        aces -= 1;
    }

    return score;
}

module.exports = {
    data: {
        name: 'blackjack',
        description: 'Zahraj si klasicky Blackjack proti dealerovi',
        options: [
            {
                name: 'sazka',
                description: 'Kolik chces vsadit?',
                type: 4,
                required: true,
                min_value: 1,
            }
        ],
    },

    async execute(interaction) {
        const userId = interaction.user.id;
        let user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);

        if (!user) {
            return await interaction.reply({ content: 'Jeste nemas zalozeny ucet, automaticky se ti zalozi po pouziti /daily nebo /balance', flags: MessageFlags.Ephemeral });
        }

        const bet = interaction.options.getInteger('sazka');
        if (user.balance < bet) {
            return await interaction.reply({ content: 'Nemas dostatecny balance', flags: MessageFlags.Ephemeral });
        }

        const newBalance = user.balance - bet;
        db.prepare('UPDATE users SET balance = ? WHERE user_id = ?').run(newBalance, userId);

        let deck = createDeck();
        let playerCards = [deck.pop(), deck.pop()];
        let dealerCards = [deck.pop(), deck.pop()];

        let playerScore = calculateScore(playerCards);
        let dealerScore = calculateScore(dealerCards);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('hit').setLabel('Vzit kartu (Hit)').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('stand').setLabel('Stat (Stand)').setStyle(ButtonStyle.Danger)
        );

        const embed = new EmbedBuilder()
            .setColor('#2e8b57')
            .setTitle('Blackjack')
            .setDescription(`Vsadil jsi: **${bet} minci**`)
            .addFields(
                { name: `Tvoje karty (Skore: ${playerScore})`, value: playerCards.map(c => c.name).join(' | '), inline: true },
                { name: `Karty dealera`, value: `${dealerCards[0].name} | [Skryta karta]`, inline: true }
            );

        const response = await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'hit') {
                playerCards.push(deck.pop());
                playerScore = calculateScore(playerCards);

                if (playerScore > 21) {
                    await i.deferUpdate();
                    collector.stop('bust');
                } else {
                    embed.setFields(
                        { name: `Tvoje karty (Skore: ${playerScore})`, value: playerCards.map(c => c.name).join(' | '), inline: true },
                        { name: `Karty dealera`, value: `${dealerCards[0].name} | [Skryta karta]`, inline: true }
                    );
                    await i.update({ embeds: [embed], components: [row] });
                }
            } else if (i.customId === 'stand') {
                await i.deferUpdate();
                collector.stop('stand');
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                db.prepare('UPDATE users SET balance = balance + ? WHERE user_id = ?').run(bet, userId);
                await interaction.deleteReply();
                return await interaction.followUp({ content: 'Dlouho ses nerozhodl, sazka se ti vraci', flags: MessageFlags.Ephemeral });
            }

            let win = 0;
            // eslint-disable-next-line no-useless-assignment
            let resultText = '';
            // eslint-disable-next-line no-useless-assignment
            let finalColor = '#2e8b57';

            if (reason === 'bust') {
                resultText = `**PROHRA** ${interaction.user} prejel 21 a progamblil **${bet}** minci`;
                finalColor = '#FF0000';
            } else {
                while (dealerScore < 17) {
                    dealerCards.push(deck.pop());
                    dealerScore = calculateScore(dealerCards);
                }

                if (dealerScore > 21) {
                    win = bet * 2;
                    resultText = `**!!VYHRA!!** Dealer prejel 21! ${interaction.user} vyhrava **${win}** minci`;
                    finalColor = '#00FF00';
                } else if (dealerScore > playerScore) {
                    resultText = `**PROHRA** Dealer ma vic, ${interaction.user} progamblil **${bet}** minci`;
                    finalColor = '#FF0000';
                } else if (dealerScore < playerScore) {
                    win = bet * 2;
                    resultText = `**!!VYHRA!!** ${interaction.user} vyhrava **${win}** minci`;
                    finalColor = '#00FF00';
                } else {
                    win = bet;
                    resultText = `**REMIZA** Sazka **${bet}** minci se vraci.`;
                    finalColor = '#FFA500';
                }
            }

            if (win > 0) {
                db.prepare('UPDATE users SET balance = balance + ? WHERE user_id = ?').run(win, userId);
                if (win > user.biggest_win) {
                    db.prepare('UPDATE users SET biggest_win = ? WHERE user_id = ?').run(win, userId);
                }
            }

            const updatedUser = db.prepare('SELECT balance FROM users WHERE user_id = ?').get(userId);

            const resultEmbed = new EmbedBuilder()
                .setColor(finalColor)
                .setTitle('Vysledek Blackjacku')
                .setDescription(`${resultText}\nNovy zustatek: **${updatedUser.balance}** minci`)
                .addFields(
                    { name: `Tvoje karty (Skore: ${playerScore})`, value: playerCards.map(c => c.name).join(' | '), inline: true },
                    { name: `Karty dealera (Skore: ${dealerScore})`, value: dealerCards.map(c => c.name).join(' | '), inline: true }
                );

            await interaction.deleteReply();
            await interaction.channel.send({ embeds: [resultEmbed] });
        });

        setTimeout(async () => {
            try {
                await interaction.deleteReply();
            } catch (error) {
            }
        }, 150000);
    }
};