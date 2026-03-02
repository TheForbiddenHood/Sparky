const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');

module.exports = {
    //Slash Command Structure
    data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription(`Invite Sparky to your own server!`),

    async execute(interaction){
        const DATA_PATH = './data.json';

        // Read data.json so we can i++ the stat
        let data;
        try {
            const dataFile = fs.readFileSync(DATA_PATH, 'utf8');
            data = JSON.parse(dataFile);
        } catch (error) {
            console.error(`Sparky couldn't read data.json:`, error);
            return interaction.reply({content: `This is awkward... I can't remember my invite link. Ask me again later...`});
        }

        // Send the console log so we know the command was triggered and by whom
        console.log(`[${new Date().toLocaleString()}] Sparky heard /invite from ${interaction.user.tag}`)

        // Let's make the embed
        const embed = new EmbedBuilder()
        .setColor('#800080')
        .setDescription(`
            I appreciate the thought! You can invite me by clicking [here](https://discord.com/oauth2/authorize?client_id=1419423775560306708&permissions=75794&integration_type=0&scope=bot) 🎉
            `)
        
        // Respond to the user via interaction
        await interaction.reply({embeds: [embed], flags: [MessageFlags.Ephemeral]});

        // Update the usage in stats (now admin panel)
        try{
            data.invitesparky_count = (data.invitesparky_count || 0) + 1;
            fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 4), 'utf8');
        } catch (err) {
            console.error(`Sparky couldn't update invitesparky_count in data.json:`, err);
        }
    }
}