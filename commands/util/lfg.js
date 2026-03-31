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
            // League of Legends
            'league of legends': { name: 'League of Legends', players: 5 },
            'league': { name: 'League of Legends', players: 5 },
            'lol': { name: 'League of Legends', players: 5 },
            'lolko': { name: 'League of Legends', players: 5 },
            // Valorant
            'valorant': { name: 'Valorant', players: 5 },
            'valo': { name: 'Valorant', players: 5 },
            // Counter-Strike 2
            'counter-strike 2': { name: 'Counter-Strike 2', players: 5 },
            'counter strike 2': { name: 'Counter-Strike 2', players: 5 },
            'cs2': { name: 'Counter-Strike 2', players: 5 },
            'cs': { name: 'Counter-Strike 2', players: 5 },
            'csko': { name: 'Counter-Strike 2', players: 5 },
            // Rainbow Six Siege
            'rainbow six siege': { name: 'Rainbow Six Siege', players: 5 },
            'rainbow six': { name: 'Rainbow Six Siege', players: 5 },
            'r6': { name: 'Rainbow Six Siege', players: 5 },
            'siege': { name: 'Rainbow Six Siege', players: 5 },
            // Teamfight Tactics
            'teamfight tactics': { name: 'Teamfight Tactics', players: 3 },
            'tft': { name: 'Teamfight Tactics', players: 3 },
            // Apex Legends
            'apex legends': { name: 'Apex Legends', players: 3 },
            'apex': { name: 'Apex Legends', players: 3 },
            // Fortnite
            'fortnite': { name: 'Fortnite', players: 4 },
            'forte': { name: 'Fortnite', players: 4 },
            'fn': { name: 'Fortnite', players: 4 },
            // Rocket League
            'rocket league': { name: 'Rocket League', players: 3 },
            'rl': { name: 'Rocket League', players: 3 },
            'rocket': { name: 'Rocket League', players: 3 },
            // Overwatch 2
            'overwatch 2': { name: 'Overwatch 2', players: 5 },
            'overwatch': { name: 'Overwatch 2', players: 5 },
            'ow': { name: 'Overwatch 2', players: 5 },
            'ow2': { name: 'Overwatch 2', players: 5 },
            // Minecraft
            'minecraft': { name: 'Minecraft', players: 4 },
            'mc': { name: 'Minecraft', players: 4 },
            'mine': { name: 'Minecraft', players: 4 },
            // Dead by Daylight
            'dead by daylight': { name: 'Dead by Daylight', players: 4 },
            'dbd': { name: 'Dead by Daylight', players: 4 },
            // PUBG
            'pubg': { name: 'PUBG', players: 4 },
            // Dota 2
            'dota 2': { name: 'Dota 2', players: 5 },
            'dota': { name: 'Dota 2', players: 5 },
            // Lethal Company
            'lethal company': { name: 'Lethal Company', players: 4 },
            'lethal': { name: 'Lethal Company', players: 4 },
            // Phasmophobia
            'phasmophobia': { name: 'Phasmophobia', players: 4 },
            'phasmo': { name: 'Phasmophobia', players: 4 },
            // Among Us
            'among us': { name: 'Among Us', players: 10 },
            'amogus': { name: 'Among Us', players: 10 },
            // GTA V / GTA Online
            'gta': { name: 'GTA Online', players: 4 },
            'gta v': { name: 'GTA Online', players: 4 },
            'gta online': { name: 'GTA Online', players: 4 },
            // Call of Duty: Warzone
            'warzone': { name: 'Call of Duty: Warzone', players: 4 },
            'wz': { name: 'Call of Duty: Warzone', players: 4 },
            'cod': { name: 'Call of Duty: Warzone', players: 4 },
            // Test
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