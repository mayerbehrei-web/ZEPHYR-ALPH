const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');
const settings = require('../settings');

function savePrefix(newPrefix) {
    const settingsPath = path.join(__dirname, '..', 'settings.js');
    let txt = fs.readFileSync(settingsPath, 'utf8');

    // Remplace module.exports.prefix = '...';
    if (/module\.exports\.prefix\s*=/.test(txt)) {
        txt = txt.replace(/module\.exports\.prefix\s*=\s*(['"`]).*?\1\s*;?/g, `module.exports.prefix = '${newPrefix}';`);
    } else {
        txt += `\n\nmodule.exports.prefix = '${newPrefix}';\n`;
    }
    fs.writeFileSync(settingsPath, txt, 'utf8');
}

async function setPrefixCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const senderId = message.key.participant || message.key.remoteJid;

        const ok = await isOwnerOrSudo(senderId);
        if (!ok) {
            return await sock.sendMessage(chatId, { text: '```Owner/Sudo seulement.```' }, { quoted: message });
        }

        const args = text.split(' ').slice(1);
        const newPrefix = (args[0] || '').trim();

        if (!newPrefix) {
            return await sock.sendMessage(chatId, { text: `Exemple : ${settings.prefix || 'zh'}setprefix !` }, { quoted: message });
        }

        if (newPrefix.length > 3) {
            return await sock.sendMessage(chatId, { text: '❌ Prefix trop long (max 3 caractères).' }, { quoted: message });
        }

        savePrefix(newPrefix);

        return await sock.sendMessage(chatId, { text: `✅ Prefix changé : ${newPrefix}` }, { quoted: message });
    } catch (e) {
        console.error('setPrefixCommand error:', e);
        return await sock.sendMessage(chatId, { text: '❌ Erreur setprefix.' }, { quoted: message });
    }
}

module.exports = setPrefixCommand;
