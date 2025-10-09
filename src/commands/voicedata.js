const { getUser } = require('../db/userRepository');
const { getSessions, getActiveSession } = require('../db/sessionRepository');
const formatTime = require('../utils/formatTime');

module.exports.run = async (message, args) => {
    const guildId = message.guild.id;
    const target = message.mentions.users.first() || message.author;

    const user = getUser(target.id, guildId);
    if (!user) {
        return message.reply(`Aucune donnée trouvée pour <@${target.id}>.`);
    }

    // 🔹 Récupère toutes les sessions terminées
    const sessions = getSessions(target.id, guildId, 0) || [];

    // 🔹 Ajoute la session en cours (si elle existe)
    const active = getActiveSession(target.id, guildId);
    if (active) sessions.push(active);    

    // 🔹 Début du message
    let reply = `**Données vocales pour <@${target.id}>**\n`;
    reply += `Tag : ${user.username}\n`;
    reply += `Total vocal : ${formatTime(user.total_time)}\n`;
    reply += `Nombre de sessions : ${sessions.length}\n\n`;

    // 🔹 Détails des sessions
    if (sessions.length === 0) {
        reply += `Aucune session enregistrée.`;
    } else {
        reply += `**Sessions :**\n`;
        for (const s of sessions) {
            const start = new Date(s.start).toLocaleString();
            const end = s.end ? new Date(s.end).toLocaleString() : "EN COURS";
            const duration = s.duration
                ? formatTime(s.duration)
                : s.end
                    ? "—"
                    : formatTime(Math.floor((Date.now() - s.start) / 1000));
            const lastSave = s.last_save_time
                ? new Date(s.last_save_time).toLocaleString()
                : "—";

            reply += `• Début : ${start}\n`;
            reply += `  Fin : ${end}\n`;
            reply += `  Durée : ${duration}\n`;
            reply += `  LastSave : ${lastSave}\n\n`;
        }
    }

    // 🔹 Discord limite à 2000 caractères
    if (reply.length > 1900) {
        reply = reply.slice(0, 1900) + "\n… (trop de sessions à afficher)";
    }

    message.reply(reply);
};
