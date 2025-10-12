const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

function loadEvents(client) {
    
    logger.info("Loading events");

    const eventsDir = path.join(__dirname, '../events');
    const eventFiles = fs.readdirSync(eventsDir).filter(f => f.endsWith('.js'));
    for (const file of eventFiles) {
        const event = require(path.join(eventsDir, file));
        const eventName = file.split('.')[0];
        client.on(eventName, event.bind(null, client));
        logger.info(`Event loaded : ${eventName}`);
        console.log(`✅ Événement chargé : ${eventName}`);
    }
}

module.exports = { loadEvents };
