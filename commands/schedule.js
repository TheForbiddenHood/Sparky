const { SlashCommandBuilder, EmbedBuilder, MessageFlags, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    // Slash Command Structure
    data: new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Creates a Discord Event, and sends a reminder 30min prior.')
    .addStringOption(option =>
        option.setName('time')
        .setDescription('Format: YYYY-MM-DD HH:MM (ex. 2026-02-10 20:55)')
        .setRequired(true))
    .addStringOption(option =>
            option.setName('name')
            .setDescription(`What's the name of your event?`)
            .setRequired(true))
    .addStringOption(option =>
        option.setName('place')
        .setDescription('Where is this event occurring?')
        .setRequired(true))
    .addStringOption(option =>
        option.setName('station')
        .setDescription(`If you'll be using a Sparky Swipe, what's the Station ID? (Leave blank if none)`)
        .setRequired(false))
    .addStringOption(option =>
        option.setName('description')
        .setDescription('Add a description to your event! (optional)')
        .setRequired(false)),
    

async execute(interaction){
    // Let's grab our data file
    const DATA_PATH = './data.json';

    // Deconstructor
    const {user, options, channel, client, guild } = interaction;

    // Send a nice and sweet console log so we know what's up
    console.log(`[${new Date().toLocaleString()}] Sparky heard /schedule from ${interaction.user.tag}`);

    // Server Check - If user is calling this outsie of a server... what's the point? We're not accepting this.
        if (!guild) {
            return interaction.reply({
                content: "This command can only be used within a server. :(",
                flags: [MessageFlags.Ephemeral]
            });
        }

    // Sparky Edit Events Permissions Check - This is so if Sparky is in a server where Sparky does not have the permissions to edit
    // events, then we'll decline the command. (This is mostly a retro-proofing for servers Sparky is currently on)
    if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageEvents)) {
        return interaction.reply({
            content: `It looks like I do not have the correct permissions to do this here (Edit Events)`
        });
    }

    // We will need to add another permissions check for the user soon. I will do this at a later time after testing this as is.

    // Here, we'll pull the data we got from the user input via interaction
    const timeAndDate = interaction.options.getString('time');
    const eventName = interaction.options.getString('name');
    const eventLoc = interaction.options.getString('place');
    const stationLink = interaction.options.getString('station') || null; // Blank if no input
    const desc = interaction.options.getString('description') || `Scheduled with Sparky!`;

    const scheduledTime = new Date(timeAndDate);
    const currentTime = new Date();

    // Now let's ensure that the input is formatted correctly
    if (isNaN(scheduledTime.getTime())) {
        return interaction.reply({
            content: `I don't think that was formatted correctly, do you mind checking over what you inputted to see if it matches my format?`,
            flags: [MessageFlags.Ephemeral]
        });
    }

    // Let's do a check if the event the user is entering is in the past, because how would we track to it if it already happened?
    if (scheduledTime <= currentTime) {
        return interaction.reply({
            content: `Believe it or not... This date already happened... I can only remind you about FUTURE events, I can't time travel just yet.`,
            flags: [MessageFlags.Ephemeral]
        });
    }

    // We defer just in case this takes a bit longer than an instant...
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral]});

    try {
        // This will be a guess on what the end time of the event will be (We're going to guess an hour?)
        const endTime = new Date(scheduledTime.getTime() + (60 * 60 * 1000));

        // Let's create the actual Discord Event.
        const discordEvent = await guild.scheduledEvents.create({
            name: stationLink ? `⚡ ${eventName}` : eventName, // This if is so we know if it's a UT San Antonio event or not. Keep it easy!
            scheduledStartTime: scheduledTime,
            scheduledEndTime: endTime,
            privacyLevel: GuildScheduledEventPrivacyLevel.Guild || 2,
            entityType: GuildScheduledEventEntityType.External,
            entityMetadata: { location: eventLoc },
            description: stationLink ? `Sparky Swipe Station ${stationLink}\n\n${desc}` : desc,
            reason: `Sparky event created by ${user.tag}`
        });

        // Now we'll also create the internal event object. We need it for 2 reasons: a reminder prior, and for Sparky Swipes.
        const newEvent = {
            name: eventName,
            time: scheduledTime.toISOString(),
            place: eventLoc,
            station: stationLink,
            channelId: channel.id,
            creatorId: user.id,
            discordEventId: discordEvent.id,
            reminded: false,
            id: Date.now().toString(),
        };

        // Let's go ahead and read our data file...
        const dataFile = fs.readFileSync(DATA_PATH, 'utf8');
        const data = JSON.parse(dataFile);

        // AND edit it.
        if (!data.events) data.events = [];
        data.events.push(newEvent);
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');

        // Now let's send a confirmation message to say that it's been created.
        await interaction.editReply({
            content: stationLink ? `Sparky Swipe Enabled Event ${eventName} Successfully created. Linked to ${stationLink}. Check it out in the events tab!` :
            `${eventName} successfully created. Check it out in the events tab!`
        });

        // Send a nice and sweet console log so we know it was created successfully.
        console.log(`[${new Date().toLocaleString()}] Sparky successfully created a discord event (${eventName})`);

    } catch (error) {
        console.error(`Sparky Ran into an error attempting to create an event:`, error);
        await interaction.editReply({
            content: `I couldn't write your awesome event down right now, please try again later!`
        });
    }    
}
};
