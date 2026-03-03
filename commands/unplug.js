const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    //Slash Command Structure
    data: new SlashCommandBuilder()
    .setName('unplug')
    .setDescription('Turn off Sparky Remotely'),

    async execute(interaction) {
        // My discord ID (needs to be updated to support pulling this from the data.json file)
        const BigBoss = '315244440707137547';

        // Lets see if the user is me or not
        if (interaction.user.id !== BigBoss){
            return interaction.reply({
                content: `You do not have permission to use this command. This command is NOT intended for users.`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Send the console log so we know the command was triggered and by whom
        console.log(`[${new Date().toLocaleString()}] Sparky heard /unplug from ${interaction.user.tag}`);

        // Give feedback to the user (aka me)
        await interaction.reply({ content: `You unplugged me! I'm entering rest mode.`});

        // Delay the shutdown so the interaction occurs
        setTimeout(() => {
            interaction.client.destroy();
            process.exit(0);
        }, 1000);
    }
};