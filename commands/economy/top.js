const db = require("../../database.js");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: {
    name: "top",
    description: "Zobraz top 5 gambleru tohoto mesice",
  },

  async execute(interaction) {
    const topUsers = db
      .prepare("SELECT user_id, total_gambled FROM users WHERE total_gambled > 0 ORDER BY total_gambled DESC LIMIT 5")
      .all();

    if (topUsers.length === 0) {
      return await interaction.reply({ content: "Tento mesic jeste nikdo nic nevyhral." });
    }

    const medals = ["🥇", "🥈", "🥉", "4.", "5."];

    let leaderboard = "";
    for (let i = 0; i < topUsers.length; i++) {
      const member = await interaction.guild.members.fetch(topUsers[i].user_id).catch(() => null);
      const displayName = member ? member.user.username : "Neznamy hrac";
      leaderboard += `${medals[i]} **${displayName}** — ${topUsers[i].total_gambled} minci\n`;
    }

    const embed = new EmbedBuilder()
      .setColor("#FFD700")
      .setTitle("Top gambleri tohoto mesice")
      .setDescription(leaderboard)
      .setTimestamp()
      .setFooter({ text: "Pavel Leaderboard" });

    await interaction.reply({ embeds: [embed] });
  },
};
