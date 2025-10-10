const fs = require('fs'); 
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'stats',
    description: 'Test for embeds feature',
    execute(message, client){

        const dataFile = fs.readFileSync('./data.json', 'utf8');
            data = JSON.parse(dataFile);

        // This creates and designs the embed
        const stats = new EmbedBuilder()
        .setColor('#05398e')
        .setTitle("⚡ Sparky's Usage Statistics")
        .setTimestamp()
        .setFooter({ text: 'Updated Live', iconURL: client.user.displayAvatarURL() })
        .addFields(
                { name: '!panel', value: `${data.panel_count + 1 || 0} uses`, inline: true },
                { name: '!pels', value: `${data.pels_count + 1 || 0} uses`, inline: true },
                { name: '!invitesparky', value: `${data.invitesparky_count + 1 || 0} uses`, inline: true },
                { name: '!8ball', value: `${data.ball_count + 1 || 0} uses`, inline: true },
            );

        message.channel.send({ embeds: [stats] });
    }
}