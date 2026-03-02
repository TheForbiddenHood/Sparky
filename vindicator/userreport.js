const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');

module.exports = {
    // Slash Command Structure 
    data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription(`Checks with Vindicator on a specific user's infraction status.`)
    .addUserOption(option => 
        option.setName('user')
        .setDescription('This is the user you want me to check')
        .setRequired(true)),

    async execute(interaction) {
        const DATA_PATH = './data.json';

        const { options, client, user } = interaction;

        const targetUser = interaction.options.getUser('user');
        const targetId = targetUser.id;

    // Just in case someone wants to try to check Sparky (for fun obv)
    if (targetId === client.user.id) {
        const replies = [
            "Nice try! You can't check my profile. I am the one who AXES!!",
            "Rude! Don't ask me for that!",
            "You know I AM a bot right?"
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];

        return interaction.reply({
            content: randomReply,
            flags: [MessageFlags.Ephemeral]
        });
    }

    try {
        // Parse through the data.json file to see if the user is in the Vindicator system
        const dataFile = fs.readFileSync(DATA_PATH, 'utf8');
        const data = JSON.parse(dataFile);

        const infractions = (data.scam_reports && data.scam_reports[targetId.id]) || 0;

        const registrations = data.abc123_registration || {};
        const studentIdKey = Object.keys(registrations).find(key => registrations[key].discordId === targetId);
        const profile = studentIdKey ? registrations[studentIdKey] : null;

        const lastSwipe = (data.last_swipes && data.last_swipes[targetId]) || null;
        const lastSeenText = lastSwipe
        ? `${lastSwipe.station} (<t:${Math.floor(lastSwipe.timestamp / 1000)}:R>)`
        : "Never Seen";

        // Check their status, and determine the visuals to use
        let statusColor = '#00ff00';

        if (infractions >= 2){
                statusColor = '#ff0000';
            } else if (infractions > 0){
                statusColor = '#ffea00';
            }

            const embed = new EmbedBuilder()
                .setColor(statusColor)
                .setTitle(`${targetUser.displayName}'s Profile`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
                    {name: 'Student ID', value: studentIdKey ? `\`${studentIdKey}\``: "Not Linked", inline: true },
                    {name: 'Major', value: profile ? profile.major : "Unknown", inline: true },
                    {name: 'Infractions', value: `${infractions}/2`, inline: true },
                    {name: 'Last Seen At', value: lastSeenText, inline: false }
                )
                .setFooter({text: 'Sparky',
                            iconURL: client.user.displayAvatarURL()
                 })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            console.log(`Sparky sent ${targetUser}'s profile to ${interaction.user.tag}`)

        } catch (error) {
            console.error("Couldn't read data for report:", error);
            await interaction.reply({
                content: `Vindicator and I aren't on talking terms right now. Please try again later.`,
                flags: [MessageFlags.Ephemeral]
            });
        }
        }
    };