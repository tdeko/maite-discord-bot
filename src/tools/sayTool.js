const readline = require('readline');

/**
 * Terminal interactif pour envoyer des messages dans les salons Discord.
 * @param {import('discord.js').Client} client
 */
async function startSayTool(client) {
    // On crée une liste propre et numérotée de serveurs et salons
    const guilds = [];
    let guildIndex = 1;

    for (const [guildId, guild] of client.guilds.cache) {
        const channels = [...guild.channels.cache.values()]
            .filter(c => c.isTextBased() && c.viewable)
            .map((c, i) => ({
                num: i + 1,
                id: c.id,
                name: c.name
            }));

        guilds.push({
            num: guildIndex++,
            id: guild.id,
            name: guild.name,
            channels
        });
    }

    // Affichage concis
    console.log('\n=== Mode SAY actif ===');
    console.log('Format : <serveur> <salon> <message>');
    console.log('Ex : "1 2 Salut !" → serveur 1, salon 2\n');

    for (const g of guilds) {
        console.log(`[${g.num}] ${g.name}`);
        for (const c of g.channels)
            console.log(`   (${c.num}) #${c.name}`);
    }
    console.log('');

    // Lecture terminal
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('line', async (input) => {
        const match = input.match(/^(\d+)\s+(\d+)\s+(.+)/);
        if (!match) return console.log('⛔ Format : <serveur> <salon> <message>');

        const [, gNum, cNum, message] = match;
        const guild = guilds.find(g => g.num === parseInt(gNum));
        if (!guild) return console.log('❌ Serveur invalide');

        const channel = guild.channels.find(c => c.num === parseInt(cNum));
        if (!channel) return console.log('❌ Salon invalide');

        try {
            const ch = client.channels.cache.get(channel.id);
            await ch.send(message);
            console.log(`📤 ${guild.name} → #${channel.name}`);
        } catch (err) {
            console.log(`⚠️ Erreur d'envoi : ${err.message}`);
        }
    });
}

module.exports = { startSayTool };
