const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');

module.exports = {
    // Slash Command Structure
    data: new SlashCommandBuilder()
    .setName('operator-panel')
    .setDescription(`Sparky's Operator Command Panel.`),

    async execute(interaction) {
        const DATA_PATH = './data.json';
        const { client, user, guild } = interaction;

        if (!guild) {
            return interaction.reply({
                content: "This command can only be used within a server. :(",
                flags: [MessageFlags.Ephemeral]
            });
        }

        let data;
        try {
            const dataFile = fs.readFileSync(DATA_PATH, 'utf8');
            data = JSON.parse(dataFile);
        } catch (error) {
            console.error(`Sparky couldn't read data.json:`, error);
            return interaction.reply({
                content: `I couldn't read the Admin list at this time. Please try again later.`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Permissions Check and Blockade
        const isBigBoss = (data.bigboss.includes(user.id));
        const operatorForServer = (data.defined_operators && data.defined_operators[guild.id]) || [];
        const isAuthorized = isBigBoss || operatorForServer.includes(user.id);

       if (!isAuthorized) {
        return interaction.reply({
            content: `You are not defined as an operator on this server.`,
            flags: [MessageFlags.Ephemeral]
        });
    }

        // Gather ALL THE DATA
        const serverCount = client.guilds.cache.size;
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const currentVersion = data.version;

        // The actual embed
        const panel = new EmbedBuilder()
        .setColor('#8e0505')
        .setTitle("⚡ Sparky's Operator Command Panel")
        .setURL()
        .setDescription(`
## Commands
            **/operator-panel** - Opens this Panel
            **/edit** - Allows you to edit user infractions
            **/editwelcome** - Opens the Welcome Message Editor
            **/promote** - Promote your members to Operators!
            **/unplug** - Turns off Sparky
            **/announcement** - Sends a broadcast to ALL admins

## Usage Numbers
            /manual - ${data.panel_count + 1 || 0} uses
            /pels - ${data.pels_count + 1 || 0} uses
            /invite - ${data.invitesparky_count + 1 || 0} uses
            /8ball - ${data.ball_count + 1 || 0} uses
            /imagetext - ${data.meme_count + 1 || 0} uses

            *(Want a feature? Something go wrong? Please let @emilioondisc know!)*
            `)
        .setTimestamp()
        //.setThumbnail()
        .setFooter({ text: `${currentVersion} | ${serverCount} Servers | ${totalUsers} Users`, iconURL: client.user.displayAvatarURL() });

        await interaction.reply({
            embeds: [panel],
            flags: [MessageFlags.Ephemeral]
        });

        console.log(`[${new Date().toLocaleString()}] Admin panel accessed by ${interaction.user.tag}`);
    }
};