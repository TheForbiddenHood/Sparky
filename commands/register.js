const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { handleModalSubmit } = require('./announcement');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Link your UT San Antonio ID and Major to your Discord account with Sparky!'),
    
    async execute(interaction) {

        const modal = new ModalBuilder()
            .setCustomId('registerModal')
            .setTitle('UT San Antonio Student Registration w/ Sparky');

        // This is the inputs...
        const idInput = new TextInputBuilder()
            .setCustomId('bush_abc123')
            .setLabel(`UT San Antonio ID (abc123)`)
            .setPlaceholder(`Enter your Student ID`)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        
        const majorInput = new TextInputBuilder()
            .setCustomId('bush_major')
            .setLabel(`Major`)
            .setPlaceholder(`Electrical Engineering, Cybersecurity, etc`)
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const emailInput = new TextInputBuilder()
            .setCustomId('bush_email')
            .setLabel(`Student Email`)
            .setPlaceholder(`firstname.lastname@my.utsa.edu`)
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(idInput),
            new ActionRowBuilder().addComponents(majorInput),
            new ActionRowBuilder().addComponents(emailInput)
        );

        await interaction.showModal(modal);
    },

    async handleModalSubmit(interaction) {
        const DATA_PATH = './data.json';
        const discordUserId = interaction.user.id;

        const abc123 = interaction.fields.getTextInputValue('bush_abc123').toLowerCase().trim();
        const major = interaction.fields.getTextInputValue('bush_major').trim() || "Not Added";
        const email = interaction.fields.getTextInputValue('bush_email').trim() || "Not Added";

        try {
            let data = { abc123_registration: {} };
            if (fs.existsSync(DATA_PATH)) {
                data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
            }
            
            if (!data.abc123_registration) data.abc123_registration = {};

            // Write the new information into the json file (save)
            data.abc123_registration[abc123] = {
                discordId: discordUserId,
                major: major,
                email: email
            };

            fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');

            const successEmbed = new EmbedBuilder()
                .setColor('#00ff73')
                .setTitle('Registration Saved')
                .setThumbnail(interaction.user.displayAvatarURL())
                .setDescription(`Successfully saved and linked **${interaction.user.displayName}**'s information with Sparky!`)
                .addFields(
                    {name: 'Student ID', value: `\`${abc123}\``, inline: true },
                    {name: 'Major', value: major, inline: true},
                    {name: 'Student Email', value: email, inline: false }
                )
                .setFooter({text: 'You now have linked access to Card Check-ins!'})
                .setTimestamp();
            
            await interaction.reply({
                embeds: [successEmbed],
                flags: [MessageFlags.Ephemeral]
            });

            console.log(`[${new Date().toLocaleString()}] Successfully Registered ${interaction.user.tag} to their ID: ${abc123}`);
        } catch (error) {
            console.error("Sparky ran into an issue while attempting to register a user. (saving)", error);
            await interaction.reply({
                content: "I ran into an issue trying to process your registration. Please try again at another time.",
                flags: [MessageFlags.Ephemeral]
            });
        }
    }
};