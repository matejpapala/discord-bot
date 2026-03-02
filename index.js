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
    }
];

client.once('clientReady', async () => {
    console.log(`🟢 Žije to! Pavel (${client.user.tag}) je online!`);

    try {
        console.log('🔄 Registruji lomítkové příkazy...');
        // Odeslání příkazů Discordu (aby ti to napovídalo, když napíšeš /)
        await client.application.commands.set(commands);
        console.log('✅ Příkazy úspěšně zaregistrovány!');
    } catch (error) {
        console.error('❌ Chyba při registraci příkazů:', error);
    }
});

client.on('interactionCreate', async interatction => {
    if (!interatction.isChatInputCommand()) return;

    if (interatction.commandName == 'ahoj') {
        await interatction.reply(`Ahoj ${interatction.user}`);
    }
});

client.login(process.env.DISCORD_TOKEN);