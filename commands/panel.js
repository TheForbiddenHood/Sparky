const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');

module.exports = {
    //Slash Command Structure
    data: new SlashCommandBuilder()
    .setName('manual')
    .setDescription(`See all of Sparky's commands!`),

    async execute(interaction){
        const DATA_PATH = './data.json';

        // Read data.json so we can i++ the stat
        let data;
        try {
            const dataFile = fs.readFileSync(DATA_PATH, 'utf8');
            data = JSON.parse(dataFile);
        } catch (error) {
            console.error(`Sparky couldn't read data.json:`, error);
            return interaction.reply({content: `I lost my manual. Try again later!`});
        }

        // Send the console log so we know the command was triggered and by whom
        console.log(`[${new Date().toLocaleString()}] Sparky heard /manual from ${interaction.user.tag}`)
        // We'll access the client via the interaction object
        const client = interaction.client;

        // Let's pull the current number of servers the bot is in right now.
        const serverCount = client.guilds.cache.size;

        // Let's also pull the total users of all the servers the bot is in right now.
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

        // Here we'll pull the current version data.
        const ver = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
        const currentVersion = ver.version

        // We'll create the embed called 'embed'
        const embed = new EmbedBuilder()
        .setColor('#05398e')
        .setTitle("⚡ Sparky's Manual")
        .setURL()
        .addFields()
        .setDescription(`
### Commands
        **/manual** - brings up this manual 📄
        **/pels** - Get some more information on PELS @ UTSA 💡
        **/invite** - Invite Sparky to your Server! 🎈
        **/schedule** - Get a 30min reminder before an event! 📅
        **/profile** - Check out your account! 📖
        **/register** - UTSA Students can link their abc123
### Fun Commands
        **/8ball** - 🎱
        **/imagetext** - Add Top/Bottom Text to an image! 🪟
### Information
        [Privacy Policy](https://github.com/TheForbiddenHood/Sparky/blob/master/PRIVACYPOLICY.md)
        [Terms of Service](https://github.com/TheForbiddenHood/Sparky/blob/master/TERMSOFSERVICE.md)
            `)
        .setTimestamp()
        .setFooter({ text: `${currentVersion} | ${serverCount} Servers | ${totalUsers} Users`, iconURL: client.user.displayAvatarURL() });
        
        // Respond to the user via interaction
        await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral]});


        // Update the usage in operator panel
        try{
            data.panel_count = (data.panel_count || 0) + 1;
            fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 4), 'utf8');    
        } catch (err) {
            console.error(`Sparky couldn't update panel_count in data.json`, err);
        }
    }
}