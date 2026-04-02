const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
} = require("discord.js");
const db = require("../../database.js");

module.exports = {
  data: {
    name: "wishlist-add",
    description: "Pridej hru na wishlist",
    options: [
      {
        name: "nazev",
        description: "Nazev hry, kterou chces pridat",
        type: 3,
        required: true,
      },
    ],
  },

  async execute(interaction) {
    const searchTerm = interaction.options.getString("nazev");
    await interaction.deferReply();

    let results;
    try {
      const res = await fetch(
        `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(searchTerm)}&limit=5`
      );
      results = await res.json();
    } catch (error) {
      console.error("CheapShark API error:", error);
      return await interaction.editReply("Nepodarilo se nacist data z API, zkus to znovu pozdeji.");
    }

    if (!results || results.length === 0) {
      return await interaction.editReply(`Zadna hra nenalezena pro: **${searchTerm}**`);
    }

    const options = results.map((game) => ({
      label: game.external.substring(0, 100),
      description: `Nejlevnejsi: $${game.cheapest}`,
      value: game.gameID,
    }));

    const select = new StringSelectMenuBuilder()
      .setCustomId("wishlist_add_select")
      .setPlaceholder("Vyber hru")
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(select);

    const response = await interaction.editReply({
      content: "Vyber hru, kterou chces pridat na wishlist:",
      components: [row],
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: (i) => i.user.id === interaction.user.id,
      time: 30000,
      max: 1,
    });

    collector.on("collect", async (i) => {
      const selectedId = i.values[0];
      const selectedGame = results.find((g) => g.gameID === selectedId);

      const existing = db.prepare("SELECT 1 FROM wishlist_games WHERE game_id = ?").get(selectedId);
      if (existing) {
        return await i.update({
          content: `**${selectedGame.external}** uz je na wishlistu.`,
          components: [],
        });
      }

      db.prepare("INSERT INTO wishlist_games (game_id, title, thumb, added_by) VALUES (?, ?, ?, ?)").run(
        selectedId,
        selectedGame.external,
        selectedGame.thumb,
        interaction.user.id
      );

      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("Hra pridana na wishlist")
        .setDescription(`**${selectedGame.external}** byla pridana na wishlist.`)
        .setThumbnail(selectedGame.thumb || null)
        .addFields({ name: "Nejlevnejsi cena", value: `$${selectedGame.cheapest}`, inline: true });

      await i.update({ content: null, embeds: [embed], components: [] });
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        interaction.editReply({ content: "Vyprsel cas na vyber.", components: [] });
      }
    });
  },
};
