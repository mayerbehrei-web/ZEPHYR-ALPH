const { handleAntiBadwordCommand } = require('../lib/antibadword');

async function antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, {
                text:
`╭──❏ 🛡️ *ANTIBADWORD*
│ ❌ Réservé aux *admins* du groupe.
╰──❏`
            }, { quoted: message });
            return;
        }

        const text = message.message?.conversation || 
                    message.message?.extendedTextMessage?.text || '';
        const match = text.split(' ').slice(1).join(' ');

        await handleAntiBadwordCommand(sock, chatId, message, match);
    } catch (error) {
        console.error('Error in antibadword command:', error);
        await sock.sendMessage(chatId, {
            text:
`╭──❏ 🛡️ *ANTIBADWORD*
│ ❌ Erreur lors du traitement de la commande.
╰──❏`
        }, { quoted: message });
    }
}

module.exports = antibadwordCommand;
