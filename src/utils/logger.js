const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

function getLogFilePath() {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(logsDir, `${date}.log`);
}

function formatMessage(level, message) {
    const now = new Date().toLocaleString('fr-FR', { hour12: false });
    return `[${now}] [${level}] ${message}\n`;
}

function write(level, message) {
    const formatted = formatMessage(level, message);
    fs.appendFileSync(getLogFilePath(), formatted);
    console.log(formatted.trim());
}

module.exports = {
    info: (msg) => write('INFO', msg),
    warn: (msg) => write('WARN', msg),
    error: (msg) => write('ERROR', msg),
};
