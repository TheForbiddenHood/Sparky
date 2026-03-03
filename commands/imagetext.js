const { SlashCommandBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const Jimp = require('jimp');
const fs = require('fs');

module.exports = {
    // Slash Command Structure
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Adds top and bottom text to an image with white borders.')
        .addAttachmentOption(option => 
            option.setName('image')
                .setDescription('The image you want to edit')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('top')
                .setDescription('Text for the top border')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('bottom')
                .setDescription('Text for the bottom border')
                .setRequired(false)),

    async execute(interaction) {
        const DATA_PATH = './data.json';
        
        // We're going to defer the request, and we do this because Discord wants instant responses and we can't do that
        // So we'll defer the interaction so we have WAY more time to take care of processing and spitting out the edited image.
        await interaction.deferReply();

        // Here we'll itemize the things we get from the interaction
        const imageAttachment = interaction.options.getAttachment('image');
        const topText = interaction.options.getString('top') || "";
        const bottomText = interaction.options.getString('bottom') || "";

        // Check if the attachment is actually an image (yk in case they send us a PDF, we're NOT processing that)
        if (!imageAttachment.contentType?.startsWith('image/')) {
            return interaction.editReply({ 
                content: "That doesn't look like an image! Please upload a PNG, JPG, or WEBP file.",
                flags: [MessageFlags.Ephemeral]
            });
        }

        try {
            // Load the image from the URL provided by Discord
            const OgImage = await Jimp.read(imageAttachment.url);

            // Dimension Guard (10MP limit) We CAN do more, but frankly 10MP is a decent sized limit for photos and it's not too
            // heavy for the hardware Sparky resides on.
            const totalPixCount = OgImage.bitmap.width * OgImage.bitmap.height;
            const MAX_PIXELS = 10000000;

            // This is how we check if the image is too big and doesn't fit within our 10MP limit.
            if (totalPixCount > MAX_PIXELS) {
                return interaction.editReply({ 
                    content: "That Image is too large (Exceeds 10MP) please try again with a smaller image :(",
                    flags: [MessageFlags.Ephemeral]
                });
            }

            // This is how we create the text as well as our paddings for the borders
            const font = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
            const padding = 120;
            const width = OgImage.bitmap.width;
            const height = OgImage.bitmap.height;

            const paddingTop = topText ? padding : 0;
            const paddingBottom = bottomText ? padding : 0;
            const canvasHeight = height + paddingTop + paddingBottom;

            // Create Canvas (Think of it as making a blank Adobe Express file)
            const canvas = new Jimp(width, canvasHeight, 0xFFFFFFFF);
            canvas.composite(OgImage, 0, paddingTop);

            // Print Top Text (IF we get input)
            if (topText) {
                canvas.print(font, 0, 0, {
                    text: topText,
                    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
                }, width, paddingTop);
            }

            // Print Bottom Text (IF we get input)
            if (bottomText) {
                canvas.print(font, 0, height + paddingTop, {
                    text: bottomText,
                    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
                }, width, paddingBottom);
            }

            // Here we'll generate the buffer... almost ready to send
            const buffer = await canvas.getBufferAsync(Jimp.MIME_PNG);
            
            // Safety check for Discord's 25MB upload limit
            if (buffer.length > 25000000) {
                return interaction.editReply({ content: "The finished image is too large to send back! Try a smaller original image." });
            }

            // Initialize the attachment
            const attachment = new AttachmentBuilder(buffer, { name: 'sparky-image.png' });

            // Since we deferred, we use editReply instead of reply
            await interaction.editReply({ files: [attachment] });

            // Send a console log to Sparky for logging usage as well as later debugging
            console.log(`[${new Date().toLocaleString()}] Sparky heard /meme from ${interaction.user.tag}`)

            // Update the count for the /operator-panel and also data collection
            try {
                const dataFile = fs.readFileSync(DATA_PATH, 'utf8');
                const data = JSON.parse(dataFile);
                data.meme_count = (data.meme_count || 0) + 1;
                fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
            } catch (err) {
                console.error("Failed to update meme stats:", err);
            }

        } catch (error) {
            console.error("Error creating imagetext:", error);
            await interaction.editReply({ 
                content: "I had a problem processing that image. Make sure it's a valid image file! (PNG, JPG, WEBP)" 
            });
        }
    }
};
