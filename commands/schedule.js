const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'schedule',
    description: 'Schedules a new event and sets a 5-minute reminder.',
    aliases: ['event', 'setevent'],
    execute(message, client) {
        // GET THE INPUT FROM USER!!!!  
        const args = message.content.slice(message.content.indexOf(' ') + 1).split('|').map(arg => arg.trim());

        if (args.length < 3) {
            return message.reply({ content: 'Please provide the event details in this format: `!schedule [YYYY-MM-DD HH:MM] | [Event Name] | [Place]`' });
        }

        const [dateTimeString, eventName, eventPlace] = args;
        const scheduledTime = new Date(dateTimeString);
        const currentTime = new Date();

        // Accepting or NOT accepting the input from user
        if (isNaN(scheduledTime.getTime())) {
            return message.reply({ content: 'I could not understand that Time/Date. Please use the format YYYY-MM-DD HH:MM (e.g., 2025-10-25 19:30).' });
        }

        // Ensure this didn't already occur
        if (scheduledTime <= currentTime) {
            return message.reply({ content: 'Nice try!  You can only have me remind you of FUTURE events, this date already passed! (Check your event date)' });
        }

        // Create the event object
        const newEvent = {
            name: eventName,
            time: scheduledTime.toISOString(), // Save as standard ISO string
            place: eventPlace,
            channelId: message.channel.id, // Save channel for the reminder
            creatorId: message.author.id,
            reminded: false,
            id: Date.now().toString(), // Simple unique ID
        };

        try {
            // Read the data file
            const dataFile = fs.readFileSync('./data.json', 'utf8');
            const data = JSON.parse(dataFile);

            // Initialize the 'events' array if it doesn't exist
            if (!data.events) {
                data.events = [];
            }

            // Add the new event
            data.events.push(newEvent);

            // Write the updated data back to the file
            fs.writeFileSync('./data.json', JSON.stringify(data, null, 2), 'utf8');

            // Send confirmation embed
            const confirmationEmbed = new EmbedBuilder()
                .setColor('#05398e')
                .setTitle('🗓️ Event Scheduled!')
                .setDescription(`I will remind everyone in this channel 30 minutes before the event you just scheduled!`)
                .addFields(
                    { name: 'Event Name', value: eventName, inline: false },
                    { name: 'Time', value: `<t:${Math.floor(scheduledTime.getTime() / 1000)}:F>`, inline: true }, // Discord timestamp format
                    { name: 'Place', value: eventPlace, inline: true },
                    { name: 'Scheduled By', value: message.author.tag, inline: true }
                )
                .setTimestamp();

            message.channel.send({ embeds: [confirmationEmbed] });

        } catch (error) {
            console.error('Error scheduling event or accessing data.json:', error);
            message.reply('An error occurred while trying to save the event.');
        }
    }
};