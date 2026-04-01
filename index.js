require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const cron = require("node-cron");

const fs = require("fs");
const path = require("path");
// eslint-disable-next-line no-unused-vars
const db = require("./database.js");
const { GENERAL_CHANNEL_ID } = require("./constants.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();
const commandsData = [];

const commandsPath = path.join(__dirname, "commands");
const commandItems = fs.readdirSync(commandsPath);

for (const item of commandItems) {
  const itemPath = path.join(commandsPath, item);

  if (fs.statSync(itemPath).isDirectory()) {
    const commandFiles = fs.readdirSync(itemPath).filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
      const filePath = path.join(itemPath, file);
      const command = require(filePath);
      client.commands.set(command.data.name, command);
      commandsData.push(command.data);
    }
  } else if (item.endsWith(".js")) {
    const command = require(itemPath);
    client.commands.set(command.data.name, command);
    commandsData.push(command.data);
  }
}

client.once("clientReady", async () => {
  console.log("Pavel is ready");
  try {
    await client.application.commands.set(commandsData);
    console.log("Commands registered successfully");
  } catch (error) {
    console.error("Error registering commands:", error);
  }

  const resetMonthlyStats = async () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const lastReset = db.prepare("SELECT value FROM metadata WHERE key = 'last_monthly_reset'").get();

    if (lastReset && lastReset.value === currentMonth) return;

    const winner = db.prepare("SELECT user_id, total_gambled FROM users WHERE total_gambled > 0 ORDER BY total_gambled DESC LIMIT 1").get();

    if (winner) {
      db.prepare("UPDATE users SET months_won = months_won + 1 WHERE user_id = ?").run(winner.user_id);
      console.log(`Vyhercem mesice je ${winner.user_id} s celkovou vyhrou ${winner.total_gambled} minci!`);

      const channel = await client.channels.fetch(GENERAL_CHANNEL_ID);
      if (channel) {
        await channel.send(`🏆 Vyhercem minuleho mesice je <@${winner.user_id}> s celkovym progamblenenim **${winner.total_gambled}** minci!`);
      }
    }

    db.prepare("UPDATE users SET total_gambled = 0").run();
    db.prepare("INSERT OR REPLACE INTO metadata (key, value) VALUES ('last_monthly_reset', ?)").run(currentMonth);
    console.log("Statistika total_gambled byla vynulovana.");
  };

  cron.schedule("0 * 1 * *", resetMonthlyStats, {
    timezone: "Europe/Prague",
  });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error("Error executing command:", error);
    await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
