const { MessageFlags } = require('discord.js');
const db = require('../../database.js');

module.exports = {
    data: {
        name: 'daily',
        description: 'Vyzvedni si daily penizky',
    },

    async execute(interaction) {
        const userId = interaction.user.id;
        const rewardAmount = 50;
        const cooldown = 24 * 60 * 60 * 1000;
        const now = Date.now();

        let user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);

        if (!user) {
            db.prepare('INSERT INTO users (user_id) VALUES (?)').run(userId);
            user = { balance: 100, daily_last_claimed: 0 };
        }

        const timeSinceLastClaim = now - user.daily_last_claimed;

        if (timeSinceLastClaim < cooldown) {
            const timeLeft = cooldown - timeSinceLastClaim;
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

            return await interaction.reply({ content: `Uz mas claimnuto, dalsi penize si muzes claimnout az za ${hours} hodin a ${minutes} minut`, flags: MessageFlags.Ephemeral });
        }

        const newBalance = user.balance + rewardAmount;

        db.prepare('UPDATE users SET balance = ?, daily_last_claimed = ? WHERE user_id = ?').run(newBalance, now, userId);

        await interaction.reply({ content: 'Daily odmena vybrana', flags: MessageFlags.Ephemeral });
    }
}