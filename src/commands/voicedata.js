const { getUser } = require('../db/userRepository');
const { getSessions } = require('../db/sessionRepository');
const formatTime = require('../utils/formatTime');

module.exports.run = async (message, args) => {
    const guildId = message.guild.id;
    const target = message.mentions.users.first() || message.author;

    const user = getUser(target.id, guildId);
    const sessions = getSessions(target.id, guildId, 0); // 0 → toutes les sessions

    if (!user) {
        return message.reply(`Aucune donnée trouvée pour <@${target.id}>.`);
    }

    // Affiche les infos utilisateur
    let reply = `**Données vocales pour <@${target.id}>**\n`;
    reply += `Tag : ${user.username}\n`;
    reply += `Total vocal : ${formatTime(user.total_time)}\n`;
    reply += `Nombre de sessions : ${sessions.length}\n\n`;

    // Détail de chaque session
    if (sessions.length === 0) {
        reply += `Aucune session enregistrée.`;
    } else {
        reply += `**Sessions :**\n`;

        // Trie par date de début
        sessions.sort((a, b) => a.start - b.start);

        for (const s of sessions) {
            const start = new Date(s.start).toLocaleString();
            const end = s.end ? new Date(s.end).toLocaleString() : "EN COURS";
            const duration = s.duration ? formatTime(s.duration) : "—";
            const lastSave = s.last_save_time ? new Date(s.last_save_time).toLocaleString() : "—";

            reply += `• Début : ${start}\n`;
            reply += `  Fin : ${end}\n`;
            reply += `  Durée : ${duration}\n`;
            reply += `  LastSave : ${lastSave}\n\n`;
        }
    }

    // Discord limite à 2000 caractères, on tronque si trop long
    if (reply.length > 1900) {
        reply = reply.slice(0, 1900) + "\n… (trop de sessions à afficher)";
    }

    message.reply(reply);
};
