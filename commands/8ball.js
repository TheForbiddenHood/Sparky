const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: '8ball',
    description: 'Asks the Magic 8-Ball a question.',
    execute(message, client) {
        // Define an array of all possible 8-ball responses.
        const responses = [
            'It is certain.',
            'It is decidedly so.',
            'Without a doubt.',
            'Yes – definitely.',
            'You may rely on it.',
            'As I see it, yes.',
            'Most likely.',
            'Outlook good.',
            'Yes.',
            'Signs point to yes.',
            'Reply hazy, try again.',
            'Ask again later.',
            'Better not tell you now.',
            'Cannot predict now.',
            'Concentrate and ask again.',
            'Don\'t count on it.',
            'My reply is no.',
            'My sources say no.',
            'Outlook not so good.',
            'Very doubtful.'
        ];

        // Check if a question was asked
        const userQuestion = message.content.slice(message.content.indexOf(' '));
        if (userQuestion.length < 2) {
            return message.reply('The 8-Ball needs a question!');
        }

        // Get a random response from the array
        const randomIndex = Math.floor(Math.random() * responses.length);
        const randomResponse = responses[randomIndex];

        // Create the embed message
        const embed = new EmbedBuilder()
            .setColor('#FFFFFF') // A nice Discord-like blue
            .setTitle('The Magic 8-Ball has spoken...')
            .setDescription(`**You asked:** ${userQuestion}\n\n**🎱:** ${randomResponse}`)

        // Send the embed to the channel
        message.channel.send({ embeds: [embed] });

        // Counter
        const dataFile = fs.readFileSync('./data.json', 'utf8');
        const data = JSON.parse(dataFile);
        data.ball_count = (data.ball_count + 1);
        fs.writeFileSync('./data.json', JSON.stringify(data, null, 4), 'utf8');
    }
};