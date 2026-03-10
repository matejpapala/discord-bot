const db = require('../../database.js');

module.exports = {
    data: {
        name: 'balance',
        description: 'Zjisti svuj balance',
    },

    async execute(interaction) {
        const userId = interaction.user.id;
        let user = db.prepare('SELECT balance FROM users WHERE user_id = ?').get(userId);

        if (!user) {
            db.prepare('INSERT INTO users (user_id, balance) VALUES (?, ?)').run(userId, 100);
            user = { balance: 100 };
        }

        await interaction.reply({ content: `${interaction.user} tvuj zustatek je: ${user.balance}` });
    }
};
