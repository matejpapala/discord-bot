const { MessageFlags } = require("discord.js");
const db = require("../../database.js");

module.exports = {
  data: {
    name: "daily",
    description: "Vyzvedni si daily penizky",
  },

  async execute(interaction) {
    const userId = interaction.user.id;
    const rewardAmount = 50;

    const today = new Date().toLocaleDateString("cs-CZ", { timeZone: "Europe/Prague" });

    let user = db.prepare("SELECT * FROM users WHERE user_id = ?").get(userId);

    if (!user) {
      db.prepare("INSERT INTO users (user_id, balance, biggest_win, total_gambled) VALUES (?, 0, 0, 0)").run(userId);
      user = db.prepare("SELECT * FROM users WHERE user_id = ?").get(userId);
    }

    if (user.daily_last_claimed === today) {
      return await interaction.reply({
        content: `Uz mas claimnuto, prijd zase zitra`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const newBalance = user.balance + rewardAmount;

    db.prepare("UPDATE users SET balance = ?, daily_last_claimed = ? WHERE user_id = ?").run(newBalance, today, userId);

    await interaction.reply({ content: "Daily odmena vybrana", flags: MessageFlags.Ephemeral });
  },
};
