const { SlashCommandBuilder } = require("discord.js");

// This was the first slash command that used the slash command architecture and is no longer going to be updated and will be removed in a future push.
module.exports = {
    data: new SlashCommandBuilder().setName("photosprinted").setDescription("This command replies to photos printed"),
    async execute(interaction) {
        await interaction.reply("bogos binted");
    },
};