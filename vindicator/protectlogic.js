const fs = require('fs');

// Word bank and Threshold Logic
const VINDICATOR_WORDBANK = [
    'giving out', 'giving away', 
    'private chat', 'dm me if interested', `hmu if you're interested`, 'send me a dm',
     'im sorry for any inconvenience this','might cause in this group',
     'start earning', 'within 24hours', 'only interested people should',
     'zelle: +'
    ];
const AXED_THRESHOLD = 2;
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
                console.log(`[${new Date().toLocaleString()}] Vindicator kicked <@${userId}>`)
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