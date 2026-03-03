const { } = require('discord.js');

module.exports = {
    data: {
        name: 'dobrounoc',
        description: 'Pavel ti popreje dobrou noc'
    },

    async execute(interaction) {
        if (interaction.user.id == '391508206662320139') {
            await interaction.reply(`Spatnou noc ${interaction.user}`);
        } else {
            await interaction.reply(`Dobrou noc ${interaction.user}`);
        }
    }
};