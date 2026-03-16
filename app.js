// importing all dependencies for the bot first
const { Client, GatewayIntentBits, GatewayVersion, ActivityType, EmbedBuilder, Collection, Partials, CommandInteraction } = require("discord.js");
const token = require("./token.js");
const fs = require('fs');
const DATA_PATH = './data.json';
const REMINDER_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const EVENT_DURATION_MS = 60 * 60 * 1000; // 1 Hour (Will be used for Check-ins)

// Logic Imports
const protectLogic = require('./vindicator/protectlogic.js');
const newJoinStartup = require('./utility/notifandintro.js');
const expressServer = require('./utility/cardswipes.js');

// This is how we'll update statuses every 5 minutes (I believe I wrote it as every 5min I'll double check)
function updateStatus(client){
    try {
        const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
        const statuses = data.statuses
        const randomStatusIndex = Math.floor(Math.random() * statuses.length);
        client.user.setActivity({
            name: statuses[randomStatusIndex], 
            type: ActivityType.Custom
        });
    } catch (e) {
        client.user.setActivity({
            name: "Booting up...",
            type: ActivityType.Custom
        });
    }
}

// This function checks if the user is in a server where Sparky is in and ALREADY has 2 infractions. (They got banned somewhere else)
async function vindicatorPatrol(client){
    let data;
    try {
        const dataFile = fs.readFileSync(DATA_PATH, 'utf8');
        data = JSON.parse(dataFile);
    } catch (e) {return; }

    if (!data.scam_reports) return;

    const infractionList = data.scam_reports;
    const logTimeStamp = () => `[${new Date().toLocaleDateString()}]`;

    for (const userId in infractionList) {
        if (infractionList[userId] >= 2) {
            for (const guild of client.guilds.cache.values()) {
                try {
                    const member = await guild.members.fetch(userId).catch(() => null);

                    if (member && member.kickable) {
                        await member.kick('Vindicator caught a high-risk user and removed them.');

                        console.log(`${logTimeStamp()} Sparky caught ${userId} in ${guild.name} (This user was flagged in another server)`);
                    }
                } catch (err) {}
            }
        }
    }
}

// Slash Commands are imported here
const slashCommand = require("./commands/slashtest.js");
const unplugCommand = require("./commands/unplug.js");
const eightballCommand = require("./commands/8ball.js");
const manualCommand = require("./commands/panel.js");
const pelsCommand = require("./commands/pels.js");
const inviteCommand = require('./commands/invitesparky.js');
const schedulerCommand = require('./commands/schedule.js');
const operatorCommand = require('./commands/adminpanel.js');
const profileCommand = require('./vindicator/userreport.js');
const editCommand = require('./vindicator/edituser.js');
const memeCommand = require('./commands/imagetext.js');
const announcementCommand = require('./commands/announcement.js');
const welcomeCommand = require('./commands/setwelcome.js');
const registerCommand = require('./commands/register.js');
const promoteCommand = require('./commands/promote.js');

// My own mental note of changes I made without pushing to the hardware application: 1

// Launch a new Discord Client, and declare intents (permissions for bot)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

// This is where we'll create a collection for the slash commands
client.commands = new Collection();
client.commands.set(slashCommand.data.name, slashCommand);
client.commands.set(eightballCommand.data.name, eightballCommand);
client.commands.set(manualCommand.data.name, manualCommand);
client.commands.set(unplugCommand.data.name, unplugCommand);
client.commands.set(pelsCommand.data.name, pelsCommand);
client.commands.set(inviteCommand.data.name, inviteCommand);
client.commands.set(schedulerCommand.data.name, schedulerCommand);
client.commands.set(operatorCommand.data.name, operatorCommand);
client.commands.set(profileCommand.data.name, profileCommand);
client.commands.set(editCommand.data.name, editCommand);
client.commands.set(memeCommand.data.name, memeCommand);
client.commands.set(announcementCommand.data.name, announcementCommand);
client.commands.set(welcomeCommand.data.name, welcomeCommand);
client.commands.set(registerCommand.data.name, registerCommand);
client.commands.set(promoteCommand.data.name, promoteCommand);

// This function is for as said in its name, to check the reminders set by the /schedule command
function checkReminders(client) {
    let data;
    try {
        const dataFile = fs.readFileSync(DATA_PATH, 'utf8');
        data = JSON.parse(dataFile);
    } catch (e) {
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
        const eventEnd = eventTime + EVENT_DURATION_MS;
        
        if (now > eventEnd) {
            eventsUpdated = true;
            return false;
        }

        const timeUntilEvent = eventTime - now;

        // 30min reminder checker
        if (timeUntilEvent > 0 && timeUntilEvent <= REMINDER_WINDOW_MS && !event.reminded) {
            
            // Get the channel to send the message (same as previously requested)
            const channel = client.channels.cache.get(event.channelId);

            if (channel) {
                // Send the reminder message at teh 30min mark
                const reminderEmbed = new EmbedBuilder()
                    .setColor('#FFD700') 
                    .setTitle(`🔔 Event Reminder`)
                    .setDescription(`The scheduled event is starting soon!`)
                    .addFields(
                        { name: 'Event', value: event.name, inline: false },
                        { name: 'Time', value: `<t:${Math.floor(eventTime / 1000)}:R> (<t:${Math.floor(eventTime / 1000)}:t>)`, inline: true },
                        { name: 'Place', value: event.place, inline: true }
                    )
                    .setTimestamp();

                channel.send({ content: `<@${event.creatorId}>, here's your reminder about your upcoming event!`, embeds: [reminderEmbed] });
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
    console.log(`[${new Date().toLocaleString()}] Login completed successfully as ${client.user.tag}!`);

    // Here we set all of the interval background checks First # is minutes
    setInterval(() => checkReminders(client), 60000);
    setInterval(() => vindicatorPatrol(client), 10 * 60 * 1000);
    setInterval(() => updateStatus(client), 10 * 60 * 1000);

    // Here we'll run intial sweeps off of client startup
    checkReminders(client);
    vindicatorPatrol(client);
    updateStatus(client);
    expressServer.initHardwareBridge(client);
});

// How we handle new server joins...
client.on('guildCreate', async guild => {
    await newJoinStartup.handleServerJoin(guild);
});

// This is the slash command listener - we use this to listen for slash commands incoming to Sparky
client.on('interactionCreate', async interaction => {

    // Handle Slash Commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        // If somehow not a command, log it. This SHOULDN'T happen. However, we'll keep this here to avoid the bot crashing if this SOMEHOW happens
        if (!command) {
        console.error(`Sparky couldn't find the ${interaction.commandName} command that was attempted by ${interaction.author.tag}`);
        return;
    }
    try{
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'I ran into an issue while trying to use this command. Please try again later.'
            });
        } else {
            await interaction.reply({
                content: 'I ran into an issue while trying to use this command. Please try again later.'
            });
        }
    }
}

    // Modal Submittal and Handling (This will be updated each time we add a new modal)
    if (interaction.isModalSubmit()) {
        
        if (interaction.customId === 'annModal') {
            const announcementCommand = client.commands.get('announcement');
            if (announcementCommand) await announcementCommand.handleModalSubmit(interaction);
            }
        
        if (interaction.customId === 'welcomeConfigModal') {
            const welcomeCommand = client.commands.get('editwelcome');
            if (welcomeCommand) await welcomeCommand.handleModalSubmit(interaction);
        }

        if (interaction.customId === 'registerModal') {
            const registerCommand = client.commands.get('register');
            if (registerCommand) await registerCommand.handleModalSubmit(interaction);
        }
            
    }
});

// This listener listens to all incoming messages; We have this here so we can check for phishing and scams.
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Vindicator Security Intervention BEFORE complying with incoming message (T = Scam, F = SAFE)
    const scamFound = await protectLogic.handleVindicator(message, DATA_PATH);
    if (scamFound) return;
});

// Welcome Messaging Handler AND Blacklist Handler
client.on('guildMemberAdd', async member => {
    const guildId = member.guild.id;

    try {
        const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
        if (data.scam_reports && data.scam_reports[member.id] >= 2) {
            if (member.kickable) {
                await member.kick('Vindicator found user attempting to rejoin a Sparky-defended server.');
                console.log(`[${new Date().toLocaleString()}] Vindicator blocked previously removed ${member.id} upon attempting to rejoin.`);
                return; // No welcome message for them!!
            }
        }
    
    // Welcome Message Handler (Now works better and allows for users to make edits to them on Discord rather than by me internally)
    if (data.welcome_configs && data.welcome_configs[guildId]) {
        const config = data.welcome_configs[guildId];
        const channel = client.channels.cache.get(config.channelId);

        if (channel) {
            const finalMessage = config.message.replace('[user]', `<@${member.id}>`);
            return channel.send(finalMessage);
        }
    }

} catch (e) { console.error(`Blacklist check failed:`, e); }

});

// "token" is the token.js file where I store the bot's authentication token (obv this is not public)
client.login(token);