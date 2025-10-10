const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'pels',
    description: 'Test for embeds feature',
    execute(message, client){
        // This creates and designs the embed
        const pels = new EmbedBuilder()
        .setColor('#ce153f')
        .setTitle("❓ IEEE Power and Electronics Society")
        .setDescription(`
            What is PELS here at UTSA look like? We're a small organization dedicated to creating unique learning opportunities and providing members with professional development focused towards the realm of small scale power and electronics. The best way to "plug in" to PELS is through our [linktree](https://linktr.ee/utsaieeepels?utm_source=linktree_profile_share&ltsid=d4aacff5-3a54-4c67-ac58-468ad1c703df), that contains everything from our instagram, how to become a member, and our RowdyLink! If you've got any other questions please feel free to reach out to our officers! 😁
            `)
        .setFooter({ text: 'Last updated on 9/23/25.' });

        message.channel.send({ embeds: [pels] });

        // Counter
        const dataFile = fs.readFileSync('./data.json', 'utf8');
        const data = JSON.parse(dataFile);
        data.pels_count = (data.pels_count + 1);
        fs.writeFileSync('./data.json', JSON.stringify(data, null, 4), 'utf8');

    }
}