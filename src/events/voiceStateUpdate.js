const { ensureUser, addTime } = require('../db/userRepository');
const { startSession, endSession } = require('../db/sessionRepository');

module.exports = async (client, oldState, newState) => {
    const guildId = newState.guild.id;
    const userId = newState.id;
    const username = newState.member.user.tag;

    ensureUser(userId, guildId, username);

    const now = Date.now();

    // Déplacement entre deux salons
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        const duration = endSession(userId, guildId, now);
        if (duration > 0) addTime(userId, guildId, duration);
        startSession(userId, guildId, now);
        return;
    }

    // Quitte un salon
    if (oldState.channelId && !newState.channelId) {
        const duration = endSession(userId, guildId, now);
        if (duration > 0) addTime(userId, guildId, duration);
    }

    // Rejoint un salon
    if (!oldState.channelId && newState.channelId) {
        startSession(userId, guildId, now);
    }
};
