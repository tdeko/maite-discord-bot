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
            Réponds comme si tu participais naturellement à la discussion du salon.
        `.trim();

        // ============================================================
        // 🔹 Construit le contexte à partir des messages précédents
        // ============================================================
        const MAX_CONTEXT_CHARS = 3000;
        const fetchedMessages = await message.channel.messages.fetch({ limit: 50 });
        const sorted = Array.from(fetchedMessages.values())
            .reverse() // du plus ancien au plus récent
            .filter(m => !m.author.bot);

        const context = [];
        let totalChars = 0;
        for (const m of sorted) {
            const formatted = `${m.author.username}: ${m.content}`;
            totalChars += formatted.length;
            if (totalChars > MAX_CONTEXT_CHARS) break;
            context.push({ role: 'user', content: formatted });
        }

        // Ajoute ton message en dernier
        context.push({ role: 'user', content: `${message.author.username}: ${prompt}` });

        // ============================================================
        // 🔹 Envoi de la requête OpenRouter
        // ============================================================
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
                'X-Title': 'Maïté Discord Bot'
            },
            body: JSON.stringify({
                model: 'mistralai/mixtral-8x7b-instruct',
                messages: [
                    { role: 'system', content: systemMessage },
                    ...context
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

        // 🔹 Debug facultatif
        console.log(`🧠 Contexte envoyé : ${context.length} messages (${totalChars} caractères)`);

    } catch (e) {
        console.error("🧠 [AI ERROR - exception]:", e);
        message.reply("Oups ma bécasse, j’ai renversé la lessive !");
    }
};
