const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: {
        name: 'lfg',
        description: 'Pavel ti pomuze najit skupinu pro hru',
        options: [
            {
                name: 'hra',
                description: 'Vyber hru, pro kterou hledáš skupinu',
                type: 3,
                required: true,
            },
            {
                name: 'hracu',
                description: 'Kolik lidi hledas?',
                type: 4,
                required: false,
            }
        ]
    },

    async execute(interaction) {
        const gameInput = interaction.options.getString('hra');
        let playerCount = interaction.options.getInteger('hracu');

        const knownGames = {
            'league of legends': { name: 'League of Legends', players: 5 },
            'lol': { name: 'League of Legends', players: 5 },
            'lolko': { name: 'League of Legends', players: 5 },
            'valorant': { name: 'Valorant', players: 5 },
            'valo': { name: 'Valorant', players: 5 },
            'cs2': { name: 'Counter-Strike 2', players: 5 },
            'rainbow six siege': { name: 'Rainbow Six Siege', players: 5 },
            'r6': { name: 'Rainbow Six Siege', players: 5 },
            'tft': { name: 'Teamfight Tactics', players: 3 },
            'teamfight tactics': { name: 'Teamfight Tactics', players: 3 },
            'test': { name: 'Testovaci hra', players: 2 }
        };

        const normalizedGame = gameInput.toLowerCase();
        let finalGameName = gameInput;

        if (knownGames[normalizedGame]) {
            finalGameName = knownGames[normalizedGame].name;
            if (!playerCount) {
                playerCount = knownGames[normalizedGame].players;
            }
        }

        if (!playerCount) {
            return await interaction.reply({ content: 'Tuhle hru neznam, zadej pocet hracu', flags: MessageFlags.Ephemeral });
        }

        let currentPlayers = [interaction.user];

        const generatePlayersText = () => {
            let text = '';
            for (let i = 0; i < playerCount; i++) {
                if (currentPlayers[i]) {
                    text += `${i + 1}. ${currentPlayers[i]}\n`;
                } else {
                    text += `${i + 1}. Volne misto\n`;
                }
            }
            return text;
        };

        const lfgEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Hledaji se hraci na ${finalGameName}`)
            .setDescription(`${interaction.user} hleda ${playerCount} hracu pro hru ${finalGameName}`)
            .addFields(
                { name: 'Prihlaseni hraci:', value: generatePlayersText() }
            )
            .setTimestamp()
            .setFooter({ text: 'Pavel LFG' });

        const joinButton = new ButtonBuilder()
            .setCustomId('join_lfg')
            .setLabel('Pridat se')
            .setStyle(ButtonStyle.Success);

        const leaveButton = new ButtonBuilder()
            .setCustomId('leave_lfg')
            .setLabel('Odejit')
            .setStyle(ButtonStyle.Danger);

        const actionRow = new ActionRowBuilder().addComponents(joinButton, leaveButton);

        const response = await interaction.reply({ content: `@everyone`, embeds: [lfgEmbed], components: [actionRow], withResponse: true, allowedMentions: { parse: ['everyone'] } });

        const message = response.resource.message;

        const collector = message.createMessageComponentCollector({ time: 3600000 });

        collector.on('collect', async i => {
            if (i.customId === 'join_lfg') {
                if (currentPlayers.length >= playerCount) {
                    return await i.reply({ content: 'Skupina je uz plna!', flags: MessageFlags.Ephemeral });
                }
                if (currentPlayers.find(p => p.id === i.user.id)) {
                    return await i.reply({ content: 'Jsi uz ve skupine!', flags: MessageFlags.Ephemeral });
                }
                currentPlayers.push(i.user);
            }
            if (i.customId === 'leave_lfg') {
                if (!currentPlayers.find(p => p.id === i.user.id)) {
                    return await i.reply({ content: 'Nejsi v skupine!', flags: MessageFlags.Ephemeral });
                }
                if (i.user.id === interaction.user.id && currentPlayers.length == 1) {
                    return await i.reply({ content: 'Nemuzes opustit skupinu, jsi jediny hrac!', flags: MessageFlags.Ephemeral });
                }
                currentPlayers = currentPlayers.filter(p => p.id !== i.user.id);
            }

            const isFull = currentPlayers.length >= playerCount;

            const updatedJoinButton = new ButtonBuilder()
                .setCustomId('join_lfg')
                .setLabel('Pridat se')
                .setStyle(ButtonStyle.Success)
                .setDisabled(isFull);

            const updatedLeaveButton = new ButtonBuilder()
                .setCustomId('leave_lfg')
                .setLabel('Odejit')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(isFull);

            const updatedActionRow = new ActionRowBuilder().addComponents(updatedJoinButton, updatedLeaveButton);

            const updatedEmbed = EmbedBuilder.from(message.embeds[0])
                .spliceFields(0, 1, { name: 'Prihlaseni hraci:', value: generatePlayersText() });


            if (isFull) {
                updatedEmbed.setColor('#00ff00').setTitle(`Skupina pro ${finalGameName} je plna!`);
            }

            await i.update({ embeds: [updatedEmbed], components: [updatedActionRow] });

            if (isFull) {
                const pings = currentPlayers.map(p => p.toString()).join(' ');
                await interaction.channel.send(`Skupina pro ${finalGameName} je full! Ready up: ${pings}`);

                collector.stop();
            }
        });
    }
};