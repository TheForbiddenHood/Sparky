const { SlashCommandBuilder, EmbedBuilder, MessageFlags, Embed } = require('discord.js');
const fs = require('fs');

module.exports = {
    // Slash Command Structure
    data: new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Saves an event and sends a reminder 30min prior to the event.')
    .addStringOption(option =>
        option.setName('time')
        .setDescription('Format: YYYY-MM-DD HH:MM (ex. 2026-02-10 20:55)')
        .setRequired(true))
    .addStringOption(option =>
            option.setName('name')
            .setDescription(`What's the name of the event?`)
            .setRequired(true))
    .addStringOption(option =>
        option.setName('place')
        .setDescription('Where is this event occuring?')
        .setRequired(true)),

async execute(interaction){
    const DATA_PATH = './data.json';

    // Deconstructor
    const {user, options, channel, client } = interaction;

    // Here, we'll pull the data we got from the user input via interaction
    const timeAndDate = interaction.options.getString('time');
    const eventName = interaction.options.getString('name');
    const eventLoc = interaction.options.getString('place');

    const scheduledTime = new Date(timeAndDate);
    const currentTime = new Date();

    // Now let's ensure that the input is A. formatted correctly, and B. not in the past.
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


    // This is how we'll create event objects
    const newEvent = {
        name: eventName,
        time: scheduledTime.toISOString(),
        place: eventLoc,
        channelId: channel.id,
        creatorId: user.id,
        reminded: false,
        id: Date.now().toString(),
    };

    // Send the console log so we know for later...
    console.log(`[${new Date().toLocaleString()}] Sparky heard /schedule from ${interaction.user.tag}`);

    try {
        // Now let's connect to the data.json file and throw it in there with the others...
        const dataFile = fs.readFileSync(DATA_PATH, 'utf8');
        const data = JSON.parse(dataFile);

        if (!data.events) data.events = [];
        data.events.push(newEvent);

        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');

        // Tell the user it actually worked
        const confirmationEmbed = new EmbedBuilder()
        .setColor('#05398e')
        .setTitle('🗓️ Event Scheduled!')
        .setDescription(`I'll send a reminder here when it's 30min to curtain call!`)
        .addFields(
            { name: 'Event Name', value: eventName, inline: false},
            {name: 'Time', value: `<t:${Math.floor(scheduledTime.getTime() / 1000)}:F>`, inline: true},
            {name: 'Place', value: eventLoc, inline: true},
            {name: 'Scheduled By', value: interaction.user.tag, inline: true}
        )
        .setTimestamp();

        // Send the confirmation embed to the user for a successful event planning (privately)
        await interaction.reply({ embeds: [confirmationEmbed], flags: [MessageFlags.Ephemeral]});
        console.log(`[${new Date().toLocaleString()}] Sparky successfully sent a reminder for an event`)

    } catch (error) {
        console.error('Sparky ran into an issue attempting to write down an event:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: 'I seem to have lost my pen and paper, please try again later!', flags: [MessageFlags.Ephemeral]});
        }
    }
}
};
