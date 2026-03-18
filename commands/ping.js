const os = require('os');
const fs = require('fs');
const path = require('path');
const settings = require('../settings.js');

function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds = seconds % (24 * 60 * 60);
    const hours = Math.floor(seconds / (60 * 60));
    seconds = seconds % (60 * 60);
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    let time = '';
    if (days > 0) time += `${days}j `;
    if (hours > 0) time += `${hours}h `;
    if (minutes > 0) time += `${minutes}m `;
    if (seconds > 0 || time === '') time += `${seconds}s`;

    return time.trim();
}

function getGMTTime() {
    const now = new Date();
    return now.toUTCString().split(' ')[4]; // HH:MM:SS
}

async function pingCommand(sock, chatId, message) {
    try {
        // ✅ Réaction automatique à la commande
        try {
            await sock.sendMessage(chatId, { react: { text: '🚀', key: message.key } });
        } catch {}

        const start = Date.now();
        await sock.sendMessage(chatId, { text: '🏓 Pong !' }, { quoted: message });
        const end = Date.now();

        const ping = Math.round((end - start) / 2);

        const uptimeFormatted = formatTime(process.uptime());
        const gmtTime = getGMTTime();

        const version = settings?.version ? `v${settings.version}` : 'v3.0.7';

        const botInfo = `
╭─────❏ *ZEPHYR•ALPH*
│ Pong! 🏓
│ \`Response Time\` : ${ping}ms ⚡
│ \`Reponses\` : ${uptimeFormatted} GMT UTC 00 ⏱️
│ \`Heure GMT\` : ${gmtTime} 🕒
│ \`Version\` : ${version} 📉
╰─────❏
›  • \`LATENCE\`
`.trim();

        // ✅ Image locale (comme help/menu)
        try {
            const imgPath = path.join(__dirname, '..', 'assets', 'ping.jpg'); // mets ping.jpg dans assets
            const img = fs.existsSync(imgPath) ? fs.readFileSync(imgPath) : null;

            if (img) {
                await sock.sendMessage(
                    chatId,
                    { image: img, caption: botInfo },
                    { quoted: message }
                );
            } else {
                await sock.sendMessage(
                    chatId,
                    { text: botInfo },
                    { quoted: message }
                );
            }
        } catch (e) {
            await sock.sendMessage(
                chatId,
                { text: botInfo },
                { quoted: message }
            );
        }

    } catch (error) {
        console.error('Error in ping command:', error);
        await sock.sendMessage(
            chatId,
            { text: '❌ Impossible d’obtenir le statut du bot.' },
            { quoted: message }
        );
    }
}

module.exports = pingCommand;

// ZEPHYR 🌬️
