require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

const commands = [
    {
        name: 'ahoj',
        description: 'Pavel te pozdravi'
    },
    {
        name: 'dobrounoc',
        description: 'Pavel ti popreje dobrou noc'
    }
];

client.once('clientReady', async () => {
    console.log(`🟢 Žije to! Pavel (${client.user.tag}) je online!`);

    try {
        await client.application.commands.set(commands);
        console.log('Commands loaded');
    } catch (error) {
        console.error('Chyba při registraci příkazů:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName == 'ahoj') {
        await interaction.reply(`Ahoj ${interaction.user}`);
    }

    if (interaction.commandName == 'dobrounoc') {
        if (interaction.user.id == '391508206662320139') {
            await interaction.reply(`Spatnou noc ${interaction.user}`);
        } else {
            await interaction.reply(`Dobrou noc ${interaction.user}`);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);