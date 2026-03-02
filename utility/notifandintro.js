const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

async function handleServerJoin(guild) {
    const BigBoss = '315244440707137547';
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
        console.log(`[${new Date().toLocaleString()}] Sparky joined ${guild.name}!`);
    } catch (err) {
        console.error("@emilioondisc was unresponsive. Weird.", err);
    }

    try {
        const serverOwner = await guild.fetchOwner();
        const introEmbed = new EmbedBuilder()
        .setColor('#05398e')
        .setTitle('⚡ Welcome to Sparky!')
        .setDescription(`Howdy, I'm Sparky!`)
        .addFields(
            {name: '❓ Getting Started', value: 'Use /manual in any text channel or even here to see all my available commands.', inline: false},
            {name: '🪓 Vindicator', value: 'I have automatically enabled my scam/phish protection in your server.', inline: false},
            {name: '🔐 Admin Permissions', value: 'Use /admin-panel to see all of my admin level commands. Contact @emilioondisc for permissions.', inline: false}
        )
        .setTimestamp()
        .setFooter({ text: `Sparky`, iconURL: client.user.displayAvatarURL() });
        await serverOwner.send({ embeds: [introEmbed]});
    } catch (err) {
        console.error(`Sparky couldn't DM the new server owner!`, err);
    }
}

module.exports = { handleServerJoin };