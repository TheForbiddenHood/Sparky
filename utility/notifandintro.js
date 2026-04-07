const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

async function handleServerJoin(guild) {
    const BigBoss = '315244440707137547'; // Needs to be updated to pull from the data.json
    const DATA_PATH = './data.json';
    const client = guild.client;

    try {
        const dataFile = fs.readFileSync(DATA_PATH, 'utf8');
        const data = JSON.parse(dataFile);

        if (!data.admins) data.admins = [];

        if (!data.admins.includes(guild.ownerId)) {
            data.admins.push(guild.ownerId);
        
            if (!data.defined_operators) data.defined_operators = {};
            if (!data.defined_operators[guild.id]) data.defined_operators[guild.id] = [];

            if (!data.defined_operators[guild.id].includes(guild.ownerId)) {
                data.defined_operators[guild.id].push(guild.ownerId);
            }

            fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
            console.log(`[${new Date().toLocaleDateString()}] Sparky gave admin to ${guild.ownerId}.`)
        }
    } catch (e) {
        console.error("Sparky failed to add new server owner to the admin list:", e);
    }

    try {
        const owner = await client.users.fetch(BigBoss);

        // Create the embed called 'joinServer'
        const joinServer = new EmbedBuilder()
        .setColor('#05398e')
        .setTitle('Sparky Joined a New Server')
        .setDescription(`Sparky has been added successfully to **${guild.name}**.`)
        .addFields(
            { name: 'Server Name', value: guild.name, inline: true },
            { name: 'Server ID', value: guild.id, inline: true },
            {name: 'Member Count', value: `${guild.memberCount} members`, inline: true }
        )
        .setTimestamp();

        await owner.send({embeds: [joinServer] });
        console.log(`[${new Date().toLocaleString()}] Sparky was added to a new server: ${guild.name}!`);
    } catch (err) {
        console.error("@emilioondisc was unresponsive. Weird.", err);
    }

    try {
        const serverOwner = await guild.fetchOwner();
const introEmbed = new EmbedBuilder()
        .setColor('#05398e')
        .setTitle(`⚡ Welcome to Sparky!`)
        .setDescription(`
### Getting Started
                Use **/manual** in any text channel (or right here) to see all my available commands! You can also use a '/' and take a look right above your message bar!
### Sparky Security
                Don't fear! Sparky's anti-phishing and anti-scam protection has been enabled on your server! (This includes removing any users who have already been caught and are in Sparky's expansive database of known phishers)
### Operator Permissions
                Use **/operator-panel** *inside* your server to see all the operator-level commands at your disposal! Have no fear using it in a normal text channel, Sparky will keep it hidden for your eyes only!
### Sparky Newsletter
                Now that you're using Sparky, anytime Sparky has large updates or announcements, expect an awesome message from me explaining my new capabilities! I'm improving just about every single day!
            `)
        .setTimestamp()
        .setFooter({ text: `Sparky`, iconURL: client.user.displayAvatarURL() });
        await serverOwner.send({ embeds: [introEmbed]});
    } catch (err) {
        console.error(`Sparky couldn't DM the new server owner!`, err);
    }
}

module.exports = { handleServerJoin };