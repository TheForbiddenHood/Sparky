const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const { execute } = require('../commands/slashtest');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactmenu')
        .setDescription('Manage or Spawn Role Menus.')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('What do you want to do?')
                .setRequired(true)
                .addChoices(
                    {name: 'Add a Role', value: 'add'},
                    {name: 'Remove a Role', value: 'remove'},
                    {name: 'Spawn Embed', value: 'spawn'}
                ))
        .addStringOption(option =>
            option.setName('listname')
                .setDescription('The name of your react list.')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to target.')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('emoji')
            .setDescription('The emoji for this role')
            .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

async execute(interaction) {
    const DATA_PATH = './data.json';
    const { options, guild, channel, user } = interaction;

    // Operator Checkpoint (we'll leave this to higher-level users on servers so randos don't add a bunch of bs)
    let data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    const isBigBoss = (data.bigboss && data.bigboss.includes(user.id));
    const operatorForServer = (data.defined_operators && data.defined_operators[guild.id]) || [];
    if (!isBigBoss && !operatorForServer.includes(user.id)) {
        return interaction.reply({ content: "Sorry, this command is for Operators only. :(", flags: [MessageFlags.Ephemeral] });
    }

    const action = options.getString('action');
    const listName = options.getString('listname');
    const targetRole = options.getRole('role');
    const targetEmoji = options.getString('emoji');

    if (!data.reaction_menus) data.reaction_menus = {};
    if (!data.reaction_menus[guild.id]) data.reaction_menus[guild.id] = {};

    // This is Helper the live embed if it exists!
    const updateLiveEmbed = async (menuData) => {
        if (!menuData.messageId || !menuData.channelId) return;
        const targetChannel = await guild.channels.fetch(menuData.channelId).catch(() => null);
        if (!targetChannel) return;
        const msg = await targetChannel.messages.fetch(menuData.messageId).catch(() => null);
        if (!msg) return;

        let description = "React to the icons below to add or remove your roles!\n\n";
        menuData.roles.forEach( r => {
            description += `${r.emoji} - <@&${r.roleId}>\n`; });
        const reactEmbed = new EmbedBuilder()
            .setColor('#05398e')
            .setTitle(`${menuData.displayName}`)
            .setDescription(description)
            .setFooter({ text: `Powered by Sparky`})
            .setTimestamp();

        await msg.edit({ embeds: [reactEmbed] });

        // Ensure NEW emojis get added
        for (const r of menuData.roles) {
            await msg.react(r.emoji).catch(() => {});
        }
    };

    // If ADD is selected.
    if (action === 'add') {
        if (!targetRole || !targetEmoji) return interaction.reply({ content: "Please provide BOTH an emoji and role to add! I get confused easily...", flags: [MessageFlags.Ephemeral] });

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        if (!data.reaction_menus[guild.id][listName]) {
            data.reaction_menus[guild.id][listName] = { displayName: listName, roles: [] };
        }

        const menu = data.reaction_menus[guild.id][listName];
        
        // Check for changes...
        if (menu.roles.some(r => r.roleId === targetRole.id)) return interaction.editReply({ content: "I already have that role in your list...", flags: [MessageFlags.Ephemeral] });

        menu.roles.push({ emoji: targetEmoji, roleId: targetRole.id });
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

        await updateLiveEmbed(menu);
        return interaction.editReply({ content: `Successfully added ${targetEmoji} | <@&${targetRole.id}> to **${listName}**.`, flags: [MessageFlags.Ephemeral] });
    }

    // If REMOVE is selected.
    if (action === 'remove') {
        if (!targetRole) return interaction.reply({ content: "Don't forget to select a role to remove from the list!", flags: [MessageFlags.Ephemeral] });
        
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        
        const menu = data.reaction_menus[guild.id][listName];
        if (!menu) return interaction.editReply({ content: "I've never heard of that list... (check your spelling)", flags: [MessageFlags.Ephemeral] });

        // What's the target?
        const roleToElim = menu.roles.find(r => r.roleId === targetRole.id);
        const emojiToElim = roleToElim ? roleToElim.emoji : null;

        menu.roles = menu.roles.filter(r => r.roleId !== targetRole.id);
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

        await updateLiveEmbed(menu);

        // Here we'll remove OLD emoji artifacts left from pre-existing roles that have been removed with a remove command
        if (emojiToElim && menu.messageId) {
            const targetChannel = await guild.channels.fetch(menu.channelId).catch(() => null);
            const msg = await targetChannel?.messages.fetch(menu.messageId).catch(() => null);

            if (msg) {
                const reaction = msg.reactions.cache.find(r =>
                    r.emoji.name === emojiToElim ||
                    r.emoji.toString() === emojiToElim ||
                    (r.emoji.id && emojiToElim.includes(r.emoji.id))
                );

                if (reaction) {
                    await reaction.users.remove(interaction.client.user.id).catch(() => {});
                }
            }
        }

        return interaction.editReply({ content: `Successfully removed ${targetEmoji} | <@&${targetRole.id}> to **${listName}**.`, flags: [MessageFlags.Ephemeral] });
    }

    // If SPAWN is selected.
    if (action === 'spawn') {
        const menu = data.reaction_menus[guild.id][listName];
        if (!menu || menu.roles.length === 0) return interaction.reply({ content: "I've never heard of that list... or it's empty. (check your spelling)", flags: [MessageFlags.Ephemeral] });

        await interaction.deferReply(   { flags: [MessageFlags.Ephemeral] });

        // Delete Old Message if it exists
        if (menu.messageId) {
            const oldChannel = await guild.channels.fetch(menu.channelId).catch(() => null);
            if (oldChannel) {
                const oldMsg = await oldChannel.messages.fetch(menu.messageId).catch(() => null);
                if (oldMsg) await oldMsg.delete().catch(() => {});
            }
        }

        let description = "React to the icons below to add or remove your roles!\n\n";
        menu.roles.forEach(r => {
            description += `${r.emoji} - <@&${r.roleId}>\n`;
        });

        const reactEmbed = new EmbedBuilder()
            .setColor('#05398e')
            .setTitle(`${menu.displayName}`)
            .setDescription(description)
            .setFooter({ text: `Powered by Sparky`})
            .setTimestamp();
        const newMsg = await channel.send({ embeds: [reactEmbed] });

        // Add initial reactions (duh)
        for (const r of menu.roles) {
            await newMsg.react(r.emoji).catch(() => {});
        }

        // Save Location
        menu.messageId = newMsg.id;
        menu.channelId = channel.id;
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

        return interaction.editReply(`**${listName}** has spawned!`);
    }
}
};