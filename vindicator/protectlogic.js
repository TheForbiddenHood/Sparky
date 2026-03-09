const fs = require('fs');

/* 
How does this all work? Basically, in a nutshell what this does is it checks all incoming messages using the basic message listener for phrases
that are listed in the vindicator wordbank. If the user says any of these phrases the message is deleted and the user's infractions are 
incremented by one, if this happens twice they are AXED. 
(The whole axing thing has been kind of removed and is more of a legacy term that I used when I first wrote this system)
*/

// This is the word bank that Sparky will use in order to check for a potential scam or phish based on previous data.
const VINDICATOR_WORDBANK = [
    'giving out', 'giving away', 
    'private chat', 'dm me if interested', `hmu if you're interested`, 'send me a dm', 'distress sale',
     'im sorry for any inconvenience this','might cause in this group',
     'start earning', 'within 24hours', 'only interested people should',
     'zelle: +'
    ];

// The "Axed Threshold" is the amount of flags the user has to trigger before they get removed from the server via Sparky's "Vindicator security"
const AXED_THRESHOLD = 2;

// This delay is for the messages that Sparky puts out to warn the user. (removing it after 5min)
const DISAPPEAR_DELAY = 5 * 60 * 1000;

// This upcoming logic will handle all of the tracking of users, essentially a demerit system, when a user hits 2 (previously 3) demerits, the user is kicked.
async function handleVindicator(message, dataPath){
    const contentLower = message.content.toLowerCase();
    const isScam = VINDICATOR_WORDBANK.some(keyword => contentLower.includes(keyword));

    if (!isScam) return false;

    try {
        const dataFile = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(dataFile);

        if (!data.scam_reports) data.scam_reports = {};

        const userId = message.author.id;
        data.scam_reports[userId] = (data.scam_reports[userId] || 0) + 1;
        const currentDemerit = data.scam_reports[userId];

        // Save updated data
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');

        if (currentDemerit >= AXED_THRESHOLD) {
            if (message.member && message.member.kickable){
                await message.member.kick(`Vindicator has detected you have reached the infraction threshold. You have been AXED.`);
                message.channel.send(`My spidey-senses determined that <@${userId}> was attempting to scam or impersonate me (a bot). They have been removed. Happy chatting!`);
                console.log(`[${new Date().toLocaleString()}] Sparky kicked <@${userId}> after being flagged twice by Vindicator`)
            } else {
                message.channel.send(`Vindicator determined that <@${userId}> should be removed, but I lack the persmissions to do it myself.`);
            }
        } else {
            await message.delete().catch(e => console.error("Could not delete flagged message: ", e));
            
            message.channel.send(`Careful what you say <@${userId}>, your message reminds me of something a scammer or two might have said before. You have **${currentDemerit}/${AXED_THRESHOLD}** infractions.`)
            .then(sentMsg => {
                setTimeout(() => {
                    sentMsg.delete().catch(err => console.error("Sparky could not auto-delete Vindicator Warning Message:", err));
                }, DISAPPEAR_DELAY);
            })
        }

        return true;
    } catch (error) {
        console.error("Something went wrong in Vindicator", error);
        return false;
    }
}

module.exports = {
    handleVindicator
};