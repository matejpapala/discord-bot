const db = require("../../database.js");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require("discord.js");
const { GAMBLE_CHANNEL_ID } = require("../../constants.js");

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

function getColor(number) {
  if (number === 0) return "green";
  return RED_NUMBERS.has(number) ? "red" : "black";
}

function formatNumber(number) {
  const emojis = { green: "🟢", red: "🔴", black: "⚫" };
  return `${emojis[getColor(number)]} **${number}**`;
}

module.exports = {
  data: {
    name: "ruleta",
    description: "Zatoc si kasino ruletu",
    options: [
      {
        name: "sazka",
        description: "Kolik chces vsadit?",
        type: 4,
        required: true,
        min_value: 1,
      },
    ],
  },

  async execute(interaction) {
    const userId = interaction.user.id;
    const user = db.prepare("SELECT * FROM users WHERE user_id = ?").get(userId);

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

    await interaction.deferReply();

    const newBalance = user.balance - bet;
    db.prepare("UPDATE users SET balance = ? WHERE user_id = ?").run(newBalance, userId);

    const rouletteEmbed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle("Ruleta")
      .setDescription(
        `Vsadil jsi **${bet}** minci\nNa co chces vsadit?\n\n` +
          `🔴 Cervena / ⚫ Cerna — vyhra 2x\n` +
          `Sude / Liche — vyhra 2x\n` +
          `🔢 Presne cislo (0-36) — vyhra 35x`,
      );

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("red").setLabel("🔴 Cervena").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("black").setLabel("⚫ Cerna").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("even").setLabel("Sude").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("odd").setLabel("Liche").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("number").setLabel("🔢 Cislo").setStyle(ButtonStyle.Success),
    );

    const response = await interaction.editReply({ embeds: [rouletteEmbed], components: [row1] });

    const collector = response.createMessageComponentCollector({
      filter: (i) => i.user.id === userId,
      time: 60000,
    });

    const finishGame = async (betLabel, won, payout) => {
      const spin = Math.floor(Math.random() * 37);

      let win = 0;
      let winText;

      if (won(spin)) {
        win = bet * payout;
        db.prepare("UPDATE users SET balance = balance + ?, total_gambled = total_gambled + ? WHERE user_id = ?").run(win, win, userId);
        winText = `**!!VYHRA!!** ${interaction.user} vyhrava **${win}** minci`;

        const currentBiggest = user.biggest_win || 0;
        if (win > currentBiggest) {
          db.prepare("UPDATE users SET biggest_win = ? WHERE user_id = ?").run(win, userId);
        }
      } else {
        winText = `**PROHRA** ${interaction.user} progamblil **${bet}** minci`;
      }

      const updatedUser = db.prepare("SELECT balance FROM users WHERE user_id = ?").get(userId);

      const resultEmbed = new EmbedBuilder()
        .setColor(win > 0 ? "#00FF00" : "#FF0000")
        .setTitle("Vysledek rulety")
        .setDescription(
          `Kulicka dopadla na: ${formatNumber(spin)}\nTvoje sazka: **${betLabel}**\n\n${winText}\nNovy zustatek: **${updatedUser.balance}** minci`,
        );

      await interaction.deleteReply();

      const finalMessage = await interaction.channel.send({ embeds: [resultEmbed] });

      if (interaction.channelId !== GAMBLE_CHANNEL_ID) {
        setTimeout(async () => {
          try {
            await finalMessage.delete();
          } catch {
            // message may already be deleted
          }
        }, 15000);
      }

      collector.stop("played");
    };

    collector.on("collect", async (i) => {
      if (i.customId === "red") {
        await i.deferUpdate();
        await finishGame("🔴 Cervena", (spin) => getColor(spin) === "red", 2);
      } else if (i.customId === "black") {
        await i.deferUpdate();
        await finishGame("⚫ Cerna", (spin) => getColor(spin) === "black", 2);
      } else if (i.customId === "even") {
        await i.deferUpdate();
        await finishGame("Sude", (spin) => spin !== 0 && spin % 2 === 0, 2);
      } else if (i.customId === "odd") {
        await i.deferUpdate();
        await finishGame("Liche", (spin) => spin % 2 === 1, 2);
      } else if (i.customId === "number") {
        const modal = new ModalBuilder()
          .setCustomId(`roulette_number_${userId}`)
          .setTitle("Sazka na cislo")
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("chosen_number")
                .setLabel("Zadej cislo (0-36)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(2),
            ),
          );

        await i.showModal(modal);

        let submitted;
        try {
          submitted = await i.awaitModalSubmit({
            filter: (m) => m.customId === `roulette_number_${userId}` && m.user.id === userId,
            time: 60000,
          });
        } catch {
          // modal not submitted in time
          return;
        }

        const input = submitted.fields.getTextInputValue("chosen_number").trim();
        const chosenNumber = Number(input);

        if (!Number.isInteger(chosenNumber) || chosenNumber < 0 || chosenNumber > 36) {
          return await submitted.reply({
            content: "Neplatne cislo, zadej cislo od 0 do 36",
            flags: MessageFlags.Ephemeral,
          });
        }

        await submitted.deferUpdate();
        await finishGame(`Cislo ${chosenNumber}`, (spin) => spin === chosenNumber, 35);
      }
    });

    collector.on("end", async (collected, reason) => {
      if (reason === "time") {
        await interaction.deleteReply();
        await interaction.followUp({ content: "Dlouho ses nerozhodl", flags: MessageFlags.Ephemeral });
      }
    });
  },
};
