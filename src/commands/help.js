module.exports.run = async (message) => {
    message.reply(`**Commandes disponibles :**
    
**!voicetime [@User] [Jours]**
→ Affiche le temps total passé en vocal.

**!lastvoiceactivity [@User]**
→ Affiche la dernière activité vocale.

**!ai [temp facultative] [message]**
→ Parle avec Maïté.`);
};
