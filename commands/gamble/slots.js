const db = require("../../database.js");
const { EmbedBuilder, MessageFlags } = require("discord.js");

const symbolMap = {
  0: "🍒",
  1: "🍋",
  2: "🍉",
  3: "🍇",
  4: "🔔",
  5: "💎",
};

module.exports = {
  data: {
    name: "slots",
    description: "Zatoc si ovocko na automatech",
    options: [
      {
        name: "sazka",
        description: "Kolik minci chces vsadit do automatu?",
        type: 4,
        required: true,
        min_value: 10,
      },
    ],
  },

  async execute(interaction) {
    const userId = interaction.user.id;
    let user = db.prepare("SELECT * FROM users WHERE user_id = ?").get(userId);

    if (!user) {
      return await interaction.reply({
        content: "Jeste nemas zalozeny ucet, automaticky se ti zalozi po pouziti /daily nebo /balance",
        flags: MessageFlags.Ephemeral,
      });
    }

    const bet = interaction.options.getInteger("sazka");
    if (user.balance < bet) {
      return await interaction.reply({ content: "Nemas dostatecny balance", flags: MessageFlags.Ephemeral });
    }

    const newBalance = user.balance - bet;
    db.prepare("UPDATE users SET balance = ? WHERE user_id = ?").run(newBalance, userId);

    const reel1 = Math.floor(Math.random() * 6);
    const reel2 = Math.floor(Math.random() * 6);
    const reel3 = Math.floor(Math.random() * 6);

    let win = 0;
    let resultText = "";

    if (reel1 === reel2 && reel2 === reel3) {
      if (reel1 === 5) win = bet * 50;
      else if (reel1 === 4) win = bet * 20;
      else win = bet * 10;
      resultText = `**JACKPOT!** Trikrat stejny symbol! ${interaction.user} vyhrava **${win}** minci!`;
    } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
      win = Math.round(bet * 1.1);
      resultText = `**Mala vyhra!** Dva stejne symboly. ${interaction.user} vyhrava **${win}** minci.`;
    } else {
      resultText = `**PROHRA** ${interaction.user} progamblil **${bet}** minci.`;
    }

    if (win > 0) {
      db.prepare("UPDATE users SET balance = balance + ?, total_gambled = total_gambled + ? WHERE user_id = ?").run(win, win, userId);
      if (win > user.biggest_win) {
        db.prepare("UPDATE users SET biggest_win = ? WHERE user_id = ?").run(win, userId);
      }
    }

    const updatedUser = db.prepare("SELECT balance FROM users WHERE user_id = ?").get(userId);

    const spinningEmbed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle("Vyherni automat")
      .setDescription(`\n**[ 🎰 | 🎰 | 🎰 ]**\n\nAutomat se toci...\n`);

    await interaction.reply({ embeds: [spinningEmbed] });

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const finalEmbed = new EmbedBuilder()
      .setColor(win > 0 ? "#00FF00" : "#FF0000")
      .setTitle("Vyherni automat")
      .setDescription(
        `\n**[ ${symbolMap[reel1]} | ${symbolMap[reel2]} | ${symbolMap[reel3]} ]**\n\n${resultText}\nNovy zustatek: **${updatedUser.balance}** minci`,
      );

    await interaction.editReply({ embeds: [finalEmbed] });

    if (interaction.channelId !== GAMLE_CHANNEL_ID) {
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (error) {}
      }, 15000);
    }
  },
};
