const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  MessageFlags,
} = require("discord.js");
const db = require("../../database.js");

module.exports = {
  data: {
    name: "wishlist-remove",
    description: "Odeber hru z wishlistu",
  },

  async execute(interaction) {
    const games = db.prepare("SELECT * FROM wishlist_games ORDER BY title").all();

    if (games.length === 0) {
      return await interaction.reply({ content: "Wishlist je prazdny.", flags: MessageFlags.Ephemeral });
    }

    const options = games.slice(0, 25).map((game) => ({
      label: game.title.substring(0, 100),
      value: game.game_id,
    }));

    const select = new StringSelectMenuBuilder()
      .setCustomId("wishlist_remove_select")
      .setPlaceholder("Vyber hru k odebrani")
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(select);

    const response = await interaction.reply({
      content: "Vyber hru, kterou chces odebrat z wishlistu:",
      components: [row],
      flags: MessageFlags.Ephemeral,
      withResponse: true,
    });

    const collector = response.resource.message.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: (i) => i.user.id === interaction.user.id,
      time: 30000,
      max: 1,
    });

    collector.on("collect", async (i) => {
      const selectedId = i.values[0];
      const game = games.find((g) => g.game_id === selectedId);

      db.prepare("DELETE FROM wishlist_games WHERE game_id = ?").run(selectedId);
      db.prepare("DELETE FROM wishlist_notifications WHERE game_id = ?").run(selectedId);

      await i.update({
        content: `**${game.title}** byla odebrana z wishlistu.`,
        components: [],
      });
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        interaction.editReply({ content: "Vyprsel cas na vyber.", components: [] });
      }
    });
  },
};
