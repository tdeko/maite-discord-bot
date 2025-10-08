module.exports.run = async (message, args) => {
    try {
        // 🔹 Lecture des arguments
        let temperature = 0.5;
        if (args[0]?.includes('.') && !isNaN(parseFloat(args[0])))
            temperature = Math.min(Math.max(parseFloat(args.shift()), 0), 2);

        const prompt = args.join(' ').trim();
        if (!prompt)
            return message.reply("Bécasse, tu dois écrire un message après la commande !");

        await message.channel.sendTyping();

        // 🔹 Message système : personnalité
        const systemMessage = `
            Tu es Maïté Ordonez, une femme de 60 ans passionnée de cuisine et de vie quotidienne.
            Tu es simple, taquine, affectueuse, et tu appelles souvent les gens “bécasse”.
            Par défaut, réponds en moins de 20 mots sauf si on te demande d'expliquer ou raconter.
        `.trim();

        // 🔹 Envoi de la requête OpenRouter
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
                'X-Title': 'Maïté Discord Bot'
            },
            body: JSON.stringify({
                // ⚠️ modèle à jour et dispo
                model: 'mistralai/mixtral-8x7b-instruct',
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: prompt }
                ],
                temperature,
                max_tokens: 500
            })
        });

        // 🔹 Lecture de la réponse JSON
        const data = await response.json();
        // console.log("🧠 [AI DEBUG] Raw response:", JSON.stringify(data, null, 2));

        // 🔹 Vérifie le statut HTTP
        if (!response.ok) {
            console.error("🧠 [AI ERROR] HTTP", response.status, response.statusText);
            return message.reply(`Erreur HTTP ${response.status} : ${data?.error?.message || 'aucune info'}`);
        }

        // 🔹 Vérifie le contenu de la réponse
        const reply = data?.choices?.[0]?.message?.content?.trim();
        if (!reply) {
            const err = data?.error?.message || JSON.stringify(data);
            console.error("🧠 [AI ERROR] Pas de contenu :", err);
            return message.reply("Oh la la, Bonux n’a rien répondu 😳");
        }

        // 🔹 Envoie la réponse finale
        await message.channel.send(reply);

    } catch (e) {
        console.error("🧠 [AI ERROR - exception]:", e);
        message.reply("Oups ma bécasse, j’ai renversé la lessive !");
    }
};


// module.exports.run = async (message, args) => {
//     try {
//         let temperature = 0.5;
//         if (args[0]?.includes('.') && !isNaN(parseFloat(args[0])))
//             temperature = Math.min(Math.max(parseFloat(args.shift()), 0), 2);

//         const prompt = args.join(' ').trim();
//         if (!prompt) return message.reply("Bécasse, tu dois écrire un message après la commande !");

//         await message.channel.sendTyping();

//         const systemMessage = `
//             Tu es Maïté Ordonez, une femme de 60 ans passionnée de cuisine et de vie quotidienne.
//             Tu es simple, taquine, affectueuse, et tu appelles souvent les gens “bécasse”.
//             Par défaut, réponds en moins de 20 mots sauf si on te demande d'expliquer ou raconter.
//         `.trim();

//         const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
//                 'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
//                 'X-Title': 'Maïté Discord Bot'
//             },
//             body: JSON.stringify({
//                 model: 'google/gemma-3-27b-it:free',
//                 messages: [
//                     { role: 'system', content: systemMessage },
//                     { role: 'user', content: prompt }
//                 ],
//                 temperature,
//                 max_tokens: 500
//             })
//         });

//         const data = await response.json();
//         const reply = data?.choices?.[0]?.message?.content?.trim();
//         message.channel.send(reply || "Oh la la, Bonux n’a rien répondu 😳");
//     } catch (e) {
//         console.error(e);
//         message.reply("Oups ma bécasse, j’ai renversé la lessive !");
//     }
// };
