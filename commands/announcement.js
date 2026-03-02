const { SlashCommandBuilder, EmbedBuilder, MessageFlags, ModalBuilder, TextInputStyle, TextInputBuilder, ActionRowBuilder, messageLink } = require('discord.js');
const fs = require('fs');

module.exports = {
    // Slash Command Setup (I can't remember what I've been calling it and I'm too lazy to check another command file rn)
    data: new SlashCommandBuilder()
    .setName('announcement')
    .setDescription('Sends update news to all admins'),

    async execute(interaction) {
        const BigBoss = '315244440707137547';

        if (interaction.user.id !== BigBoss){
            return interaction.reply({
                content: `You do not have permission to use this command. This command is NOT intended for users.`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        const modal = new ModalBuilder()
        .setCustomId('annModal')
        .setTitle('Sparky Admin Broadcast');

        const titleInput = new TextInputBuilder()
        .setCustomId('annTitle')
        .setLabel('Announcement Title')
        .setPlaceholder('ex. System Maintenance or New Feature')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

        const messageInput = new TextInputBuilder()
        .setCustomId('annMessage')
        .setLabel("The body of the embed you'll be sending")
        .setPlaceholder('Enter the full message details here...')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
        const secondActionRow = new ActionRowBuilder().addComponents(messageInput);

        modal.addComponents(firstActionRow, secondActionRow);

        await interaction.showModal(modal);
    },

    async handleModalSubmit(interaction) {
        const DATA_PATH = './data.json';
        const { user, client } = interaction;

        const title = interaction.fields.getTextInputValue('annTitle');
        const message = interaction.fields.getTextInputValue('annMessage');

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        let data;
        try {
            data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
        } catch (e) {
            return interaction.editReply("I couldn't read the admin list at this time. Please try again later.");
        }

        const admins = data.admins || [];

        const annEmbed = new EmbedBuilder()
        .setColor('#165ae1')
        .setTitle(`📣 ${title}`)
        .setDescription(message)
        .setTimestamp()
        .setFooter({ text: 'Sparky News', iconURL: client.user.displayAvatarURL()});

        let successCount = 0;
        let failCount = 0;

        for (const adminId of admins) {
            try {
                const adminUser = await client.users.fetch(adminId);
                await adminUser.send({embeds: [annEmbed]});
                successCount++;
            } catch (err) {
                console.error(`Sparky was unable to DM admin ${adminId}:`, err.message);
                failCount++;
            }
        }

        await interaction.editReply({
            content: `Newspaper was sent out, I was able to successfully deliver to **${successCount}** admins, and failed to deliver to **${failCount}** admins (DMs were probably closed).`
        });

        console.log(`[${new Date().toLocaleString()}] Announcement made successfully.`)
     }
};