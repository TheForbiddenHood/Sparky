const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    // Slash Command Structure
    data: new SlashCommandBuilder()
    .setName('edit')
    .setDescription(`Manually edit a user's infractions (Operators Only)`)
    .addUserOption(option =>
        option.setName('user')
        .setDescription('The user you want to adjust')
        .setRequired(true))
    .addIntegerOption(option =>
        option.setName('amount')
        .setDescription('Amount of infractions to add/subtract (ex. 1 or -1')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const DATA_PATH = './data.json';
        const { options, client, user, guild, member } = interaction;

        // Pull the current infraction data from vindicator security
        let data;
        try {
            const dataFile = fs.readFileSync(DATA_PATH, 'utf8');
            data = JSON.parse(dataFile);
        } catch (err) {
            console.error("Sparky ran into an error trying to read data.json:", err);
            return interaction.reply({
                content: `Vindicator isn't sharing their data with me right now. Please try again later.`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Permissions Check and Blockade
        const isBigBoss = (data.bigboss.includes(user.id));
        const operatorForServer = (data.defined_operators && data.defined_operators[guild.id]) || [];
        const isAuthorized = isBigBoss || operatorForServer.includes(user.id);

        // This is standard across all commands that require an authorization check.
       if (!isAuthorized) {
        return interaction.reply({
            content: `You are not defined as an operator on this server.`,
            flags: [MessageFlags.Ephemeral]
        });
    }

        // Set up some variables for later use in terms of actually editing their statuses
        const targetUser = options.getUser('user');
        const targetId = targetUser.id;
        const adjustment = options.getInteger('amount');

        // If the user tries to target Sparky we'll send a little message because I honestly don't want to handle that fiasco.
        if (targetId === client.user.id) {
            return interaction.reply({
                content: `Wait... that's me! Don't do that!`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Update their status
        if (!data.scam_reports) data.scam_reports = {};

        const oldInfractions = data.scam_reports[targetId] || 0;
        const newInfractions = Math.max(0, oldInfractions + adjustment);

        data.scam_reports[targetId] = newInfractions;

        try {
            fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');

            let kicked = false;
            if (newInfractions >= 2) {
                const targetMember = await guild.members.fetch(targetId).catch(() => null);
                if (targetMember && targetMember.kickable) {
                    await targetMember.kick(`Vindicator saw that a user's infractions were manually adjusted above threshold.`);
                    kicked = true;
                }
            }
        
        const statusEmoji = newInfractions >= 2 ? '🔴' : (newInfractions > 0 ? '🟡' : '🟢');
        const statusColor = newInfractions >= 2 ? '#ff0000' : (newInfractions > 0 ? '#ffa500' : '#00ff00');

        const embed = new EmbedBuilder()
                .setColor(statusColor)
                .setTitle('Vindicator Profile Updated')
                .setDescription(kicked
                    ? `Adjustment caused <@${targetId}> to reach the threshold. The user has been removed.` : `Adjustment successful for <@${targetId}>.`)
                .addFields(
                    { name: 'Previous Count', value: `${oldInfractions}`, inline: true },
                    { name: 'Adjustment', value: `${adjustment > 0 ? '+' : ''}${adjustment}`, inline: true },
                    { name: 'New Total', value: `${statusEmoji} ${newInfractions}/2`, inline: true }
                )
                .setFooter({ text: `Adjusted by ${user.tag}` })
                .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            flags: [MessageFlags.Ephemeral]
        });

        console.log(`[${new Date().toLocaleString()}] Infractions for ${targetId} adjusted to ${newInfractions} by ${user.tag}`);
        
        } catch (err) {
            console.error("Sparky ran into an error trying to write into data.json:", err);
            await interaction.reply({
                content: "I had an issue trying to update Vindicator's data. Please try again later.",
                flags: [MessageFlags.Ephemeral]
            });
        }
    }
};