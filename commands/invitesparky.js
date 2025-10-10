const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'invitesparky',
    description: 'Test for embeds feature',
    execute(message, client){
        // This creates and designs the embed
        const invitesparky = new EmbedBuilder()
        .setColor('#800080')
        .setDescription(`
            I appreciate the thought! You can invite me by clicking [here](https://discord.com/oauth2/authorize?client_id=1419423775560306708&permissions=67600&integration_type=0&scope=bot) 🎉
            `)

        message.channel.send({ embeds: [invitesparky] });

        // Counter
        const dataFile = fs.readFileSync('./data.json', 'utf8');
        const data = JSON.parse(dataFile);
        data.invitesparky_count = (data.invitesparky_count + 1);
        fs.writeFileSync('./data.json', JSON.stringify(data, null, 4), 'utf8');
    }
}