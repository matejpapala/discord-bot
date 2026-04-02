const { EmbedBuilder } = require("discord.js");
const db = require("../../database.js");

module.exports = {
  data: {
    name: "wishlist",
    description: "Zobraz wishlist her a jejich aktualni ceny",
  },

  async execute(interaction) {
    const games = db.prepare("SELECT * FROM wishlist_games ORDER BY added_at DESC").all();

    if (games.length === 0) {
      return await interaction.reply("Wishlist je prazdny. Pridej hru pres `/wishlist-add`.");
    }

    await interaction.deferReply();

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Wishlist her")
      .setTimestamp()
      .setFooter({ text: `Celkem ${games.length} her` });

    const displayGames = games.slice(0, 10);

    for (const game of displayGames) {
      try {
        const res = await fetch(`https://www.cheapshark.com/api/1.0/games?id=${game.game_id}`);
        const data = await res.json();

        if (data && data.deals && data.deals.length > 0) {
          const bestPrice = data.deals[0].price;
          const bestDeal = data.deals.find((d) => d.price === bestPrice && d.storeID === "1")
            || data.deals[0];
          const savings = parseFloat(bestDeal.savings).toFixed(0);
          const dealLink = `https://www.cheapshark.com/redirect?dealID=${bestDeal.dealID}`;

          let priceText = `**$${bestDeal.price}**`;
          if (parseFloat(bestDeal.savings) > 0) {
            priceText += ` ~~$${bestDeal.retailPrice}~~ (-${savings}%)`;
          } else {
            priceText += ` (plna cena: $${bestDeal.retailPrice})`;
          }
          priceText += `\n[Koupit zde](${dealLink})`;

          embed.addFields({ name: data.info.title, value: priceText, inline: false });
        } else {
          embed.addFields({ name: game.title, value: "Cena nedostupna", inline: false });
        }
      } catch (error) {
        console.error(`Error fetching price for ${game.title}:`, error);
        embed.addFields({ name: game.title, value: "Chyba pri nacitani ceny", inline: false });
      }
    }

    if (games.length > 10) {
      embed.setDescription(`Zobrazeno 10 z ${games.length} her.`);
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
