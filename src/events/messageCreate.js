const { COMMAND_PREFIX } = require('../../config');
const badWords = require('../utils/badWords');

module.exports = async (client, message) => {
    if (message.author.bot) return;
    const content = message.content.toLowerCase();

    if (content.startsWith(COMMAND_PREFIX)) {
        const [cmd, ...args] = content.slice(1).trim().split(/\s+/);
        const commandFile = require(`../commands/${cmd}.js`);
        if (commandFile) await commandFile.run(message, args);
        return;
    }

    if (badWords.some(w => content.includes(w)))
        return message.channel.send('Hoho mais dites donc !');

    if (content.includes('bécasse') || content.includes('becasse'))
        return message.channel.send("Y'a pas écrit bécasse ici !");
};
