const express = require('express');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

function initHardwareBridge(client){
    const server = express();
    server.use(express.json());

    const DATA_PATH = './data.json';

    let initialData;
    try{
        initialData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    } catch (err) {
        console.error("ngrok initialization FAILED. Sparky was unable to read values in data.json.");
        return;
    }

    const config = initialData.bridge_config || {};
    const PORT = config.port;
    
    // Receive the Swipe from External Hardware
    server.post('/api/swipe', async (req, res) => {
        const { studentAbc, key, stationName } = req.body;

        try{
            const dataFile = fs.readFileSync(DATA_PATH, 'utf8');
            const data = JSON.parse(dataFile);
            const liveConfig = data.bridge_config;

            const KEY = liveConfig.api_key;
            const LOG_TEST = liveConfig.log_channel_id;

            if (key !== KEY) {
            console.log(`[${new Date().toLocaleString()}] Sparky received an unauthorized data entry request. It was denied.`);
            return res.status(401).end();
            }
        

        const cleanId = studentAbc.toLowerCase().trim();
        const location = stationName || `Unknown Location`;
        const registrations = data.abc123_registration || {};
        const profile = registrations[cleanId];
        const discordId = profile ? profile.discordId : null;
        const userDisplay = discordId ? `<@${discordId}>` : `\`${cleanId}\` (Unregistered)`;

        if (discordId) {
                if (!data.last_swipes) data.last_swipes = {};
                data.last_swipes[discordId] = {
                    station: location,
                    timestamp: Date.now()
                };
                fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
        }
        
        console.log(`[${new Date().toLocaleString()}] ${cleanId} swiped at ${location}.`);

            // Send a notif to Discord for test (Will be updated later)
            const channel = await client.channels.fetch(LOG_TEST);
            if (channel) {
                const swipeEmbed = new EmbedBuilder()
            .setColor(discordId ? '#00ff73' : '#ffa500')
            .setTitle(discordId ? 'Recieved Swipe!' : 'Unknown Swipe')
            .setDescription(discordId ? `Welcome back ${userDisplay}` : `An Unregistered ID was scanned.`)
            .addFields(
                { name: 'Station', value: location || 'Unknown Location', inline: true },
                { name: 'Student ID', value: `\`${studentAbc}\``, inline: true },
                {name: 'Major', value: profile ? (profile.major || "Not Provided") : "N/A", inline: true },
                { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'Magstripe Integration'});

            await channel.send({ content: discordId ? `${userDisplay} has checked in.` : null, embeds: [swipeEmbed]});
            }

            // Close Connection to the Card Swiper Station w/o sending confirmation
            res.status(204).end();
    } catch (err) {
        console.error("Sparky had a problem receiving a card swipe, and couldn't send the embed.", err);
        res.status(500).end();
    }
});

    // Start and Open Server for Listening
    server.listen(PORT, () => {
        console.log(`[${new Date().toLocaleString()}] ngrok online. Sparky is listening for data on port ${PORT}.`);
    })
}

module.exports = { initHardwareBridge };