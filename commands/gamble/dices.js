const db = require('../../database.js');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: {
        name: 'dices',
        description: 'Zagambli si v kostkach',
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

        const dicesEmbed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('Hod kostkami')
            .setDescription(`Vsadil jsi ${bet} minci\nNa co tipnes ze padne soucet dvou kostek?`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('less_than_7').setLabel('Pod 7 (Vyhra 2x)').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('exactly_7').setLabel('Presne 7 (Vyhra 4x)').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('more_than_7').setLabel('Vice nez 7 (Vyhra 2x)').setStyle(ButtonStyle.Danger)
        );

        const response = await interaction.reply({ embeds: [dicesEmbed], components: [row], flags: MessageFlags.Ephemeral });

        const collector = response.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            const diceOne = Math.floor(Math.random() * 6) + 1;
            const diceTwo = Math.floor(Math.random() * 6) + 1;
            const sum = diceOne + diceTwo;

            let win = 0;
            // eslint-disable-next-line no-useless-assignment
            let winText = '';

            if (i.customId === 'less_than_7' && sum < 7) win = bet * 2;
            else if (i.customId === 'more_than_7' && sum > 7) win = bet * 2;
            else if (i.customId === 'exactly_7' && sum === 7) win = bet * 4;

            if (win > 0) {
                db.prepare('UPDATE users SET balance = balance + ? WHERE user_id = ?').run(win, userId);
                winText = `**!!VYHRA!!** ${interaction.user} vyhrava ${win} minci`;
                if (win > user.biggest_win) {
                    db.prepare('UPDATE users SET biggest_win = ? WHERE user_id = ?').run(win, userId);
                }
            } else {
                winText = `**PROHRA** ${interaction.user} progamblil **${bet}**`;
            }

            const updatedUser = db.prepare('SELECT balance FROM users WHERE user_id = ?').get(userId);

            const resultEmbed = new EmbedBuilder()
                .setColor(win > 0 ? '#00FF00' : '#FF0000')
                .setTitle('Vysledek hodu')
                .setDescription(`Kostky: **${diceOne}** a **${diceTwo}** (Součet: **${sum}**)\n\n${winText}\n Nový zůstatek: **${updatedUser.balance}**`)


            await i.deferUpdate();

            await interaction.deleteReply();

            await interaction.channel.send({ embeds: [resultEmbed] });

            collector.stop();
        });

        collector.on('end', async (collected, reason) => {
            if (reason == 'time') {
                db.prepare('UPDATE users SET balance = balance + ? WHERE user_id = ?').run(bet, userId);

                await interaction.deleteReply();
                await interaction.followUp({ content: 'Dlouho ses nerozhodl, sazka se nuluje', flags: MessageFlags.Ephemeral });
            }
        });
    }
}