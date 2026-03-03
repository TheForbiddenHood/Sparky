const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('promote')
        .setDescription('Promote a user to Operator status for this server.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user you want to promote to Operator status')
                .setRequired(true)),

    async execute(interaction) {
        const DATA_PATH = './data.json';
        const { options, guild, user, client } = interaction;
        const targetUser = options.getUser('user');

        // We add this check since there's no reason to try to process a request if it's NOT in a server, since operators are specific to servers
        if (!guild) {
            return interaction.reply({
                content: "We're not in a server; there's no one to promote!",
                flags: [MessageFlags.Ephemeral]
            });
        }

        let data;
        try {
            const dataFile = fs.readFileSync(DATA_PATH, 'utf8');
            data = JSON.parse(dataFile);
        } catch (err) {
            console.error("Sparky ran into an issue trying to read data.json after hearing the /promote command:", err);
            return interaction.reply({
                content: "I forgot where my data is stored... Please try again later!",
                flags: [MessageFlags.Ephemeral]
            });
        }
        
        // Here we'll call in the operator list, and myself! (lol)
        const isBigBoss = (data.bigboss && data.bigboss.includes(user.id));
        const operatorList = (data.defined_operators && data.defined_operators[guild.id]) || [];
        const isAlreadyOperator = operatorList.includes(user.id);

        // If ther user trying to use the command is A. not me or B. not an operator, tell them privately they cannot use this.
        if (!isBigBoss && !isAlreadyOperator) {
            return interaction.reply({
                content: `You do not have the authority to appoint Operators for **${guild.name}**.`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        // This is in case they try to promote a bot, because why would they even want / need to do that?
        if (targetUser.bot) {
            return interaction.reply({ content: "Silly rabbit, operator is for humans!", flags: [MessageFlags.Ephemeral] });
        }

        // Just in case they want to promote a user who's already been promoted. Tell them privately.
        if (operatorList.includes(targetUser.id)) {
            return interaction.reply({ content: `${targetUser.displayName} is already an Operator for this server!`, flags: [MessageFlags.Ephemeral] });
        }

        try {
            // This is where we write the new addition to the operator list in the data file.
            if (!data.defined_operators) data.defined_operators = {};
            if (!data.defined_operators[guild.id]) data.defined_operators[guild.id] = [];

            data.defined_operators[guild.id].push(targetUser.id);

            // Save the changes
            fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');

            // If all went well then we send the confirmation text to the user (will be updated to an embed)
            await interaction.reply({
                content: `Successfully promoted <@${targetUser.id}> to Operator.`,
                flags: [MessageFlags.Ephemeral]
            })

    } catch (error) {
        console.error("Sparky had a problem trying to save a new operator:", error);
        await interaction.reply({
            content: `I ran into an issue trying to promote your new Operator. Please try again later`,
            flags: [MessageFlags.Ephemeral]
        });
    }
}
};