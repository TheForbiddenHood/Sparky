const { EmbedBuilder, MessageFlags, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    // Slash Command Structure
    data: new SlashCommandBuilder()
    .setName('pels')
    .setDescription(`See some information about PELS!`),

    async execute(interaction){
        const DATA_PATH = './data.json';

        // Read data.json so we can i++ the stat in operator panel
        let data;
        try {
            const dataFile = fs.readFileSync(DATA_PATH, 'utf8');
            data = JSON.parse(dataFile);
        } catch (error) {
            console.error(`Sparky couldn't read data.json:`, error);
            return interaction.reply({content: `I forgot what I was going to say. Please try again later!`});
        }

        // Send the console log so we know the command was triggered and by whom
        console.log(`[${new Date().toLocaleString()}] Sparky heard /pels from ${interaction.user.tag}`)

        // Create the embed called 'embed'
        const embed = new EmbedBuilder()
        .setColor('#ce153f')
        .setTitle("❓ IEEE Power and Electronics Society")
        .setDescription(`
            What is PELS here at UT San Antonio? We're a small organization dedicated to creating both unique learning/professional opportunities and bridging the gap between theory and practicum for small-scale power and electronics. The best way to "plug in" to PELS is through our [linktree](https://linktr.ee/utsaieeepels?utm_source=linktree_profile_share&ltsid=d4aacff5-3a54-4c67-ac58-468ad1c703df), which has everything you need to get involved with us! Make sure to keep up with our RowdyLink to know when our next event on campus is!
            `)
        .setFooter({text: `Last updated on 2/7/26.`})

        // Respond to the user via interaction (this one is public so EVERYONE can see it!)
        await interaction.reply({embeds: [embed] });

        // Update the usage in operator panel
        try{
            data.pels_count = (data.pels_count || 0) + 1;
            fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 4), 'utf8');
        } catch (err) {
            console.error(`Sparky couldn't update pels_count in data.json:`, err);
        }
    }
}