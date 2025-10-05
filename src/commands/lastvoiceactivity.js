const { getSessions } = require('../db/sessionRepository');
const formatTime = require('../utils/formatTime');

module.exports.run = async (message) => {
    const user = message.mentions.users.first() || message.author;
    const guildId = message.guild.id;

    const sessions = getSessions(user.id, guildId, 0);
    if (sessions.length === 0)
        return message.reply(`<@${user.id}> n'a jamais été en vocal.`);

    const last = sessions[sessions.length - 1];
    if (!last.end)
        return message.reply(`<@${user.id}> est actuellement en vocal depuis ${formatTime(Math.floor((Date.now() - last.start)/1000))}.`);

    message.reply(`Dernière activité vocale de <@${user.id}> : ${new Date(last.end).toLocaleString()}`);
};
