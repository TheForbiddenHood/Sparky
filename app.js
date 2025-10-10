// importing all dependencies
const { Client, GatewayIntentBits, GatewayVersion, ActivityType, EmbedBuilder, Collection } = require("discord.js");
// Did you really think I would just give you my bot token?
const token = require("./token.js");
const fs = require('fs');
const DATA_PATH = './data.json';
const REMINDER_WINDOW_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

// Importing files where commands are calling from
const panelCommand = require('./commands/panel.js');
const invitesparkyCommand = require('./commands/invitesparky.js');
const pelsCommand = require('./commands/pels.js');
const statsCommand = require('./commands/stats.js');
const magic8BallCommand = require('./commands/8ball.js');
const scheduleCommand = require('./commands/schedule.js');

// Launch a new Discord Client, and declare intents (permissions for bot)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers
    ]
   
});

function checkReminders(client) {

    let data;
    try {
        // READ the data.json file
        const dataFile = fs.readFileSync(DATA_PATH, 'utf8');
        data = JSON.parse(dataFile);
    } catch (e) {
        // If file doesn't exist or is invalid, just return
        return; 
    }

    if (!data.events || data.events.length === 0) {
        return; 
    }

    const now = Date.now();
    let eventsUpdated = false;

    // Loop through all saved events
    data.events = data.events.filter(event => {
        const eventTime = new Date(event.time).getTime();
        const timeUntilEvent = eventTime - now;

        // Did the event already happen? If it did we do NOT need it
        if (timeUntilEvent < -REMINDER_WINDOW_MS) {
            eventsUpdated = true; 
            return false; 
        }

        // 30min reminder checker
        if (timeUntilEvent > 0 && timeUntilEvent <= REMINDER_WINDOW_MS && !event.reminded) {
            
            // Get the channel to send the message
            const channel = client.channels.cache.get(event.channelId);

            if (channel) {
                // Send the reminder message
                const reminderEmbed = new EmbedBuilder()
                    .setColor('#FFD700') 
                    .setTitle(`🔔 Event Reminder (30 Minutes!)`)
                    .setDescription(`The scheduled event is starting soon!`)
                    .addFields(
                        { name: 'Event', value: event.name, inline: false },
                        { name: 'Time', value: `<t:${Math.floor(eventTime / 1000)}:R> (<t:${Math.floor(eventTime / 1000)}:t>)`, inline: true },
                        { name: 'Place', value: event.place, inline: true }
                    )
                    .setTimestamp();

                channel.send({ content: `<@${event.creatorId}>, attention!`, embeds: [reminderEmbed] });
            }

            // Mark event as reminded so it doesn't send the message again
            event.reminded = true;
            eventsUpdated = true;
        }

        return true; 
    });

    // Write the updated data (with 'reminded: true' or removed old events)
    if (eventsUpdated) {
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
    }
}


// Login Confirmation / Status printed in terminal
client.on('ready', () => {
    console.log(`Login completed successfully as ${client.user.tag}!`);

    setInterval(() => checkReminders(client), 60000);
    checkReminders(client);

    // Set bot status (This is not the "playing" status function, this is the casual status that appears like a thought bubble)
    client.user.setActivity({
        name: "!panel | PELS",
        type: ActivityType.Custom,
    })

});

// Feeling lost with the commands? Let's talk about it!
// to enable the bot and get it up and running type 'node app.js' into the console. This starts the application locally.
// Want to kill the bot? Go into discord, enter a server with the bot and type '!unplug' (only works for user IDs entered in the "!unplug" command line.
// This bot's welcome feature is NOT portable. This means every time a server wants the welcome feature it has to be hard-coded in each time.
// This bot currently services 130 people across 3 discord servers.


// Listener for incoming messages (This scans ALL messages sent by users for the prefix)
client.on('messageCreate', message => {
    if (message.author.bot) return;
    
    if (message.content.startsWith('!8ball')) {
        console.log('Sparky heard "!8ball" and executed the code.')
        magic8BallCommand.execute(message, client);
}

    if (message.content.startsWith('!schedule')) {
        console.log('Sparky heard "!schedule" and executed the code.')
        scheduleCommand.execute(message, client);
}

    // The following commands pull from respective files and execute their code - these typically are embeds, I found it easier to keep the code clean like this.

    if (message.content === '!panel') {
        console.log('Sparky heard "!panel" and sent the panel.')
        panelCommand.execute(message, client);
    }

    if (message.content === '!invitesparky') {
        console.log('Sparky heard "!invitesparky" and sent the embed.')
        invitesparkyCommand.execute(message, client);
    }

    if (message.content === '!stats') {
        console.log('Sparky heard "!stats" and sent the embed.')
        statsCommand.execute(message, client);
    }

    if (message.content === '!pels'){
        console.log('Sparky heard "!pels" and sent the embed.')
        pelsCommand.execute(message, client);
    }

    // The !unplug command - ends the bot client. Notice the "USER-ID", this specifies WHO can use this command.
    if (message.content === '!unplug') {
        if (message.author.id === '315244440707137547') {
            console.log('Sparky heard "!unplug" and is going offline.');
            message.channel.send('Someone pulled my plug! (This usually means I am getting an update, stay tuned!)').then(() => {
                client.destroy();
            });
        } else {
            message.channel.send('You do not have permission to use this command. Please consult with @emilioondisc for administrator privileges.');
        }
    }
});


// Welcome Messaging Handler - this operation controls how the bot handles new users with welcome messages, just prints.
client.on('guildMemberAdd', async member => {
    
    // Welcome Message Listener for Testing Grounds
    if (member.guild.id !== "1419481285142904975") return;
    const channelOne = client.channels.cache.get('1419481286837272718');
    if (!channelOne) return console.error("Channel wasn't found, cancelling welcome.");
    channelOne.send(`Welcome to the my testing grounds, <@${member.id}>, if you're here that means you've got some things to test how fun!`);

    // Welcome Message Listener for PELS
    if (member.guild.id !== "1299155250988449853") return;
    const channelTwo = client.channels.cache.get('1299155250988449856');
    if (!channelTwo) return console.error("Channel wasn't found, cancelling welcome.");
    channelTwo.send(`Welcome to the IEEE Power & Electronics Society (PELS) discord <@${member.id}>, we hope you'll stick around a while and join us at our upcoming events!`);
});

// "token" refers to token.js which will keep the bot's unique token safe from prying eyes by keeping it local to the host here.

client.login(token);

