const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');

module.exports = {
    //Slash Command Structure
    data: new SlashCommandBuilder()
    .setName('unplug')
    .setDescription('Turn off Sparky Remotely'),

    async execute(interaction) {
        const DATA_PATH = './data.json';

        // Get the BigBoss variable from data.json
        let data;
        try {
            const dataFile = fs.readFileSync(DATA_PATH, 'utf8');
            data = JSON.parse(dataFile);
        } catch (error) {
            console.error(`Sparky couldn't read data.json for unplug authorization:`, error);
            return interaction.reply({
                content: `Sparky couldn't check if you're the owner or not. Please try again later.`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        // See if the user is me or not
        const bouncer = data.bigboss || [];
        const isBigBoss = bouncer.includes(interaction.user.id);

        // If the user isn't me, DO NOT let them use this command.
        if (!isBigBoss){
            return interaction.reply({
                content: `You do not have permission to use this command. This command is NOT intended for users.`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Send the console log so we know the command was triggered and by whom
        console.log(`[${new Date().toLocaleString()}] Sparky entering Rest Mode.`);

        // Give feedback to the user (aka me)
        await interaction.reply({ content: `You unplugged me! I'm entering rest mode.`});

        // Delay the shutdown so the interaction occurs
        setTimeout(() => {
            interaction.client.destroy();
            process.exit(0);
        }, 1000);
    }
};