const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');

module.exports = {
    // Slash Command Structure
    data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the magic 8ball a question!')
    .addStringOption(option => 
        option.setName('question')
        .setDescription('The question you want to ask')
        .setRequired(true)),

    async execute(interaction) {
        const DATA_PATH = './data.json';

        // Now let's pull the question from the interaction
        const userQuestion = interaction.options.getString('question');

        // Here we'll read data.json so we can pull the possible responses as well as later i++ the counter
        let data;
        try {
            const dataFile = fs.readFileSync(DATA_PATH, 'utf8');
            data = JSON.parse(dataFile);
        } catch (error) {
            console.error(`Sparky couldn't read data.json:`, error);
            return interaction.reply({content: `I can't find my crystal ball. Try again later!`});
        }

         // Send the console log so we know the command was triggered and by whom
        console.log(`[${new Date().toLocaleString()}] Sparky heard /8ball from ${interaction.user.tag}`)

        // Get the responses from data.json
        const ballResponse = data.eightball;

        // Randomize the response and prep it for the embed.
        const randomReply = Math.floor(Math.random() * ballResponse.length);
        const eightballResponse = ballResponse[randomReply];

        // The embed
        const embed = new EmbedBuilder()
        .setColor('#7289DA')
        .setTitle('The Magic 8-Ball has spoken...')
        .setDescription(`${interaction.user.tag} asked: ${userQuestion}\n\n🎱: ${eightballResponse}`)

        // Respond to the user via interaction
        await interaction.reply({ embeds: [embed] });

        // Update the usage in stats (now admin panel)
        try{
            data.ball_count = (data.ball_count || 0) + 1;
            fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 4), 'utf8');
        } catch (err) {
            console.error(`Sparky couldn't update ball_count in data.json:`, err);
        }
    }
}