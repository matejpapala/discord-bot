const { AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: {
        name: 'obrazek',
        description: 'Pavel ti posle obrazek'
    },

    async execute(interaction) {

        const imagesFolder = path.join(__dirname, '../images');

        const allFiles = fs.readdirSync(imagesFolder);
        const imageFiles = allFiles.filter(file =>
            file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png') || file.endsWith('.gif')
        );

        const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];

        const imagePath = path.join(imagesFolder, randomImage);
        const attachment = new AttachmentBuilder(imagePath);

        await interaction.reply({ files: [attachment] });
    }
};