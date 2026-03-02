const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Client and Token
const token = require('./token.js');
const clientId = require('./clientid.js');

const commands = [];

// Find slash commands in their files
const slashtest = require('./commands/slashtest.js');
const eightball = require('./commands/8ball.js');
const manual = require('./commands/panel.js');
const unplug = require('./commands/unplug.js');
const pels = require('./commands/pels.js');
const invite = require('./commands/invitesparky.js');
const schedule = require('./commands/schedule.js');
const operator = require('./commands/adminpanel.js');
const profile = require('./vindicator/userreport.js');
const edit = require('./vindicator/edituser.js');
const meme = require('./commands/imagetext.js');
const ann = require('./commands/announcement.js');
const welconfig = require('./commands/setwelcome.js');
const register = require('./commands/register.js');
const promote = require('./commands/promote.js');

// Push slash commands
commands.push(slashtest.data.toJSON());
commands.push(eightball.data.toJSON());
commands.push(manual.data.toJSON());
commands.push(unplug.data.toJSON());
commands.push(pels.data.toJSON());
commands.push(invite.data.toJSON());
commands.push(schedule.data.toJSON());
commands.push(operator.data.toJSON());
commands.push(profile.data.toJSON());
commands.push(edit.data.toJSON());
commands.push(meme.data.toJSON());
commands.push(ann.data.toJSON());
commands.push(welconfig.data.toJSON());
commands.push(register.data.toJSON());
commands.push(promote.data.toJSON());


// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// Actual Deployment
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(Routes.applicationCommands(clientId), { body : commands});

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();