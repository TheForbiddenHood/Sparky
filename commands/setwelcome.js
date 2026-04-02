const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const { handleModalSubmit } = require('./announcement');
const { channel } = require('diagnostics_channel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('editwelcome')
        .setDescription('Configure and create your own welcome message for your server!'),

    async execute(interaction) {
        const DATA_PATH = './data.json';
        const { user, guild } = interaction;

        // We add this check since there's no reason to try to process a request if it's NOT in a server, since operators are specific to servers
        if (!guild) {
            return interaction.reply({
                content: "I think it's kind of hard to set a welcome message for a DM. Maybe I can lay down a welcome mat or something... (you need to be in a server to use this command)",
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

        // Permissions Check and Blockade (This checks to ENSURE that the user is either an operator or me lol)
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
        // Create the modal called 'modal'
        const modal = new ModalBuilder()
                .setCustomId('welcomeConfigModal')
                .setTitle('Welcome Message Editor');
        
        // Here are the inputs we're receiving from the modal
        const channelInput = new TextInputBuilder()
                .setCustomId('welcomeChannelId')
                .setLabel("Channel ID")
                .setPlaceholder('Insert the Channel ID of the channel you want my welcome messages to go to!')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
        
        const messageInput = new TextInputBuilder()
                .setCustomId('welcomeMessage')
                .setLabel("Welcome Message")
                .setPlaceholder("User [user] to mention the new member in your message!")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

        const dmInput = new TextInputBuilder()
                .setCustomId('welcomeDm')
                .setLabel("Private DM Message")
                .setPlaceholder("Leave blank if you don't want to send a DM. [user] works here too!")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false);
        
        const firstActionRow = new ActionRowBuilder().addComponents(channelInput);
        const secondActionRow = new ActionRowBuilder().addComponents(messageInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(dmInput);

        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

        await interaction.showModal(modal);

        
    },

    async handleModalSubmit(interaction) {
        const DATA_PATH = './data.json';
        const guildId = interaction.guild.id;

        // Put the values we received from the modal into variables we can use for later
        const channelId = interaction.fields.getTextInputValue('welcomeChannelId');
        const welcomeMsg = interaction.fields.getTextInputValue('welcomeMessage');
        const dmMsg = interaction.fields.getTextInputValue('welcomeDm');

    try {
        const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

        if (!data.welcome_configs) data.welcome_configs = {};

        data.welcome_configs[guildId] = {
            channelId: channelId,
            message: welcomeMsg,
            dmMessage: dmMsg || null
        };

        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');

        // To let the user know they enabled DM messages or not we will include it in the interaction reply to the editor
        const status = dmMsg ? "Public & DM message." : "Public Message (No DM).";

        // Send the message to let the user know privately that their message was saved correctly
        await interaction.reply({
            content: `Welcome Message Updated Successfully! Welcome message will be sent to channel: <#${channelId}> with Message: ${welcomeMsg}, and is a ${status}`,
            flags: [MessageFlags.Ephemeral]
        });

        console.log(`[${new Date().toLocaleString()}] Welcome Message updated for ${guildId} by ${interaction.user.tag}`);
    } catch (error) {
        console.error("Sparky failed to update a welcome message:", error);
        await interaction.reply({ content: `I had an issue trying to write down your message. Please try again later.`, flags: [MessageFlags.Ephemeral]});
    }

    }
};