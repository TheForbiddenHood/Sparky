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
        
        const isBigBoss = (data.bigboss && data.bigboss.includes(user.id));
        const operatorList = (data.defined_operators && data.defined_operators[guild.id]) || [];
        const isAlreadyOperator = operatorList.includes(user.id);

        if (!isBigBoss && !isAlreadyOperator) {
            return interaction.reply({
                content: `You do not have the authority to appoint Operators for **${guild.name}**.`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        // 4. Logic Guards
        if (targetUser.bot) {
            return interaction.reply({ content: "Bots cannot be Operators. They aren't very good at paperwork.", flags: [MessageFlags.Ephemeral] });
        }

        if (operatorList.includes(targetUser.id)) {
            return interaction.reply({ content: `${targetUser.displayName} is already a designated Operator for this server!`, flags: [MessageFlags.Ephemeral] });
        }

        try {
            // 5. Update the data
            if (!data.defined_operators) data.defined_operators = {};
            if (!data.defined_operators[guild.id]) data.defined_operators[guild.id] = [];

            data.defined_operators[guild.id].push(targetUser.id);

            // Save the changes
            fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');

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