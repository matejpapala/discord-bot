const { EmbedBuilder } = require("discord.js");
const db = require("../database.js");
const { GENERAL_CHANNEL_ID } = require("../constants.js");

const SAVINGS_THRESHOLD = 20;

let storesMap = null;

async function fetchStores() {
  if (storesMap) return storesMap;

  try {
    const res = await fetch("https://www.cheapshark.com/api/1.0/stores");
    const stores = await res.json();
    storesMap = {};
    for (const store of stores) {
      storesMap[store.storeID] = store.storeName;
    }
  } catch (error) {
    console.error("Error fetching stores:", error);
    storesMap = {};
  }

  return storesMap;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkWishlistDeals(client) {
  const games = db.prepare("SELECT * FROM wishlist_games").all();
  if (games.length === 0) return;

  const stores = await fetchStores();
  const newDeals = [];

  for (const game of games) {
    try {
      const res = await fetch(`https://www.cheapshark.com/api/1.0/games?id=${game.game_id}`);
      const data = await res.json();

      if (!data || !data.deals) continue;

      for (const deal of data.deals) {
        const savings = parseFloat(deal.savings);
        if (savings < SAVINGS_THRESHOLD) continue;

        const alreadyNotified = db
          .prepare("SELECT 1 FROM wishlist_notifications WHERE game_id = ? AND deal_id = ?")
          .get(game.game_id, deal.dealID);

        if (alreadyNotified) continue;

        newDeals.push({
          gameId: game.game_id,
          title: data.info.title,
          thumb: data.info.thumb,
          dealId: deal.dealID,
          price: deal.price,
          retailPrice: deal.retailPrice,
          savings: savings.toFixed(0),
          storeName: stores[deal.storeID] || "Neznamy obchod",
        });
      }

      await delay(200);
    } catch (error) {
      console.error(`Error checking deals for ${game.title}:`, error);
    }
  }

  if (newDeals.length === 0) return;

  // Group deals by game, pick best deal per game
  const bestByGame = {};
  for (const deal of newDeals) {
    if (!bestByGame[deal.gameId] || parseFloat(deal.price) < parseFloat(bestByGame[deal.gameId].price)) {
      bestByGame[deal.gameId] = deal;
    }
  }

  const embed = new EmbedBuilder()
    .setColor("#ff9900")
    .setTitle("Wishlist slevy!")
    .setTimestamp();

  for (const deal of Object.values(bestByGame)) {
    const dealLink = `https://www.cheapshark.com/redirect?dealID=${deal.dealId}`;
    const value = `**$${deal.price}** ~~$${deal.retailPrice}~~ (-${deal.savings}%)\n${deal.storeName} - [Koupit](${dealLink})`;
    embed.addFields({ name: deal.title, value, inline: false });
  }

  try {
    const channel = await client.channels.fetch(GENERAL_CHANNEL_ID);
    if (channel) {
      await channel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error("Error sending wishlist deals notification:", error);
  }

  // Record all notified deals
  const insertStmt = db.prepare(
    "INSERT OR IGNORE INTO wishlist_notifications (game_id, deal_id, price) VALUES (?, ?, ?)"
  );
  for (const deal of newDeals) {
    insertStmt.run(deal.gameId, deal.dealId, deal.price);
  }

  // Cleanup old notifications (older than 30 days)
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
  db.prepare("DELETE FROM wishlist_notifications WHERE notified_at < ?").run(thirtyDaysAgo);

  console.log(`Wishlist check complete: ${Object.keys(bestByGame).length} games on sale notified.`);
}

module.exports = checkWishlistDeals;
