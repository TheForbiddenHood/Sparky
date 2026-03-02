const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder().setName("photosprinted").setDescription("This command replies to photos printed"),
    async execute(interaction) {
        await interaction.reply("bogos binted");
    },
};