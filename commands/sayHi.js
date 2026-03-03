const { } = require('discord.js');

module.exports = {
    data: {
        name: 'ahoj',
        description: 'Pavel te pozdravi'
    },

    async execute(interaction) {
        await interaction.reply(`Ahoj ${interaction.user}`);
    }
};