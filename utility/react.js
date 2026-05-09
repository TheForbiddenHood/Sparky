const { PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

// We'll make this function handle our roles
function initReactionRoles(client) {
    const DATA_PATH = './data.json';

    // Role Adjustment Logic 
    async function adjustRole(reaction, user, add = true) {
        // No bots (This really shouldn't happen so this might be redundant, but maybe future-proofing?)
        if (user.bot) return;

        // This is to handle partials (if something changes while the bot is offline for some reason)
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Sparky failed to fetch the partial reaction: ', error);
                return;
            }
        }

        try {

            // Data Integrity Sync
            if (!fs.existsSync(DATA_PATH)) return;

            // Let's load the data from the json file
            const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

            const guildId = reaction.message.guildId;
            if (!guildId || !data.reaction_menus || !data.reaction_menus[guildId]) return;

            // Lets ENSURE the emojis are easy for us to decode (specifically if they use custom emojis)
            const emojiUsed = reaction.emoji.id ? reaction.emoji.toString() : reaction.emoji.name;

            // Lookup each list in the server to check if this is the one we want at this moment...
            const serverMenus = data.reaction_menus[guildId];
            let targetRoleId = null;

            for (const listName in serverMenus) {
                const menu = serverMenus[listName];

                // Does the list belong to the msg reacted?
                if (menu.messageId === reaction.message.id) {
                    const mapping = menu.roles.find(r => r.emoji === emojiUsed);

                if (mapping) {
                    targetRoleId = mapping.roleId;
                    break;
                }
            }
        }

        // Apply said role (we're not just larping being able to make this work!)
        if (targetRoleId) {
            const guild = reaction.message.guild;
            if (!guild) return;

        // Permission Pre-Check (Manage Roles)
        const botMember = await guild.members.fetch(client.user.id);
        if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
            console.error(`User in ${guild.name} attempted to use React! but Sparky does not have Manage Roles permissions.`);
            return
        }


            const member = await guild.members.fetch(user.id).catch(() => null);
            const role = await guild.roles.fetch(targetRoleId).catch(() => null);

            if (role && member) {
                if (add) {
                        await member.roles.add(role).catch(e => console.error(`Sparky failed to add a role, specifically ${role.name}: `, e));
                        console.log(`[${new Date().toLocaleString()}] ${role.name} added to ${user.tag} in ${guild.name}`);
                    } else {
                        await member.roles.remove(role).catch(e => console.error(` Sparky failed to remove a role, specifically ${role.name}:  `, e));
                        console.log(`[${new Date().toLocaleString()}] ${role.name} removed from ${user.tag} in ${guild.name}`);
                    }
                }
            }   
        } catch (err) {
            console.error("Sparky wet the bed in react: ", err);
        }
    }

    // Event Listeners! Otherwise how else will we know this is happening?

    // Fires when a reaction is added
    client.on('messageReactionAdd', async (reaction, user) => { await adjustRole(reaction, user, true); }); 
    
    // Fires when a reaction is !added
    client.on('messageReactionRemove', async (reaction, user) => {await adjustRole(reaction, user, false); });

    // Send a console to know we're up and running live
    console.log(`[${new Date().toLocaleString()}] React! is active. `);
}

module.exports = { initReactionRoles };