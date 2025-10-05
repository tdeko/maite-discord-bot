require('dotenv').config();
const { client } = require('./src/core/client');
const { loadEvents } = require('./src/core/loader');
const { UPDATE_SESSION_INTERVAL } = require('./config');
const { updateActiveSessions, gracefulShutdown } = require('./src/voice/sessionManager');

loadEvents(client);
client.login(process.env.TOKEN);

setInterval(updateActiveSessions, UPDATE_SESSION_INTERVAL);
