const express = require('express');
const { EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');

function initHardwareBridge(client){
    // Turn on the express server
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
        const now = new Date();

        // This is how we look at ongoing events, and determine if the swipe was for a check-in or just a standard swipe.
        const activeEvent = (data.events || []).find(event => {
            if (!event.station || event.station !== location) return false;

            const startTime = new Date(event.time);
            const endTime = new Date(startTime.getTime() + (60 * 60 * 1000)); // 1 Hour Duration for event from startTime

            return now >= startTime && now <= endTime;
        });

        // Identify the User
        const registrations = data.abc123_registration || {};
        const profile = registrations[cleanId];
        const discordId = profile ? profile.discordId : null;
        const userDisplay = discordId ? `<@${discordId}>` : `\`${cleanId}\` (Unregistered)`;

        // If the swipe came from a registered user - lets DM them to let them know they checked in!
        if (discordId) {
            try {
                const user = await client.users.fetch(discordId);
                const dmConfirm= new EmbedBuilder()
                    .setColor('#00ff73')
                    .setTitle(`Check in Successful`)
                    .setDescription(`Hello **${user.username}**! You've successfully checked into the **${activeEvent.name}** event. Have fun!`)
                    .setFooter({ text: `Sparky Swipe`});

                await user.send({ embeds: [dmConfirm]}).catch(() => {
                    console.log(`[${new Date().toLocaleString()}] Sparky was unable to DM ${user.tag}. (DMs likely closed)`);
                });
            } catch (err) {
                console.error("Sparky ran into an issue trying to DM a registered user:", err);
            }

        // Let's also update data.json to reflect what just occured (/profile)
        if (!data.last_swipes) data.last_swipes = {};
            data.last_swipes[discordId] = {
                station: location,
                timestamp: Date.now(),
                eventName: activeEvent ? activeEvent.name : null
            };
        }

        // This is where we'll have our LIVE event tracker system setup
        if (activeEvent) {
            // This is the i++ counter for the embed
            activeEvent.swipeCount = (activeEvent.swipeCount || 0) + 1;

            const eventChannel = await client.channels.fetch(activeEvent.channelId).catch(() => null);

            // Create the embed
            if (eventChannel) {
                const liveTrack = new EmbedBuilder()
                    .setColor('#f15a22')
                    .setTitle(`Sparky Swipe for ${activeEvent.name}`)
                    .setDescription(`**${location}** is the active Sparky Swipe Station.`)
                    .addFields(
                        { name: 'Total Check-ins', value: `**${activeEvent.swipeCount}**, inline: true`}
                    )
                    .setFooter({ text: 'Sparky Swipe'});

            if (activeEvent.trackerMsgId) {
                try {
                    const msg = await eventChannel.messages.fetch(activeEvent.trackerMsgId);
                    await msg.edit({ embeds: [liveTrack]});
                } catch (err) {
                    // If for SOME reason someone deletes the tracker - reprint
                    const newMsg = await eventChannel.send({ embeds: [liveTrack]});
                    activeEvent.trackerMsgId = newMsg.id;
                }
            } else {
                // Create the Embed on FIRST swipe for event
                const firstMsg = await eventChannel.send({ embeds: [liveTrack]});
                activeEvent.trackerMsgId = firstMsg.id;
            }
        }
    }
    
    // Let's go ahead and SAVE to data.json
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');

    // Console log for success - then we DONT send info back to swiper
    console.log(`[${new Date().toLocaleString()}] ${cleanId} swiped at ${location}.`);
    res.status(204).end();

} catch (err) {
        console.error("Sparky had a problem receiving a card swipe, and couldn't send the embed.", err);
        res.status(500).end();
    }
});

server.listen(PORT, () => {
    console.log(`[${new Date().toLocaleString()}] ngrok online. Sparky is listening for data on port ${PORT}.`);
});
}

module.exports = { initHardwareBridge };