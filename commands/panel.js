const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'panel',
    description: 'Test for embeds feature',
    execute(message, client){
        // This creates and designs the embed
        const panel = new EmbedBuilder()
        .setColor('#05398e')
        .setTitle("⚡ Sparky's Command Panel")
        .setURL()
        .setDescription(`
            **Traditional Commands**
            !panel - brings up this manual 📄
            !pels - Get some more information on PELS 💡
            !invitesparky - Invite Sparky over 🎈
            !unplug - Unplug Sparky 🔌
            !stats - What do the numbers say? #️⃣
            !schedule - Save the date!

            **Fun Commands**
            !8ball - 🎱
        
            `)
        .setTimestamp()
        //.setThumbnail()
        .setFooter({ text: 'v0.1.8a | 3 Servers', iconURL: client.user.displayAvatarURL() });

        message.channel.send({ embeds: [panel] });

        // Counter
        const dataFile = fs.readFileSync('./data.json', 'utf8');
        const data = JSON.parse(dataFile);
        data.panel_count = (data.panel_count + 1);
        fs.writeFileSync('./data.json', JSON.stringify(data, null, 4), 'utf8');
    }
}


