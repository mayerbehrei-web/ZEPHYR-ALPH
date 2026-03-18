const isAdmin = require('../lib/isAdmin');

function formatDelay(ms) {
    const totalSec = Math.round(ms / 1000);
    if (totalSec < 60) return `${totalSec}s`;
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return sec ? `${min}m ${sec}s` : `${min}m`;
}

async function muteCommand(sock, chatId, senderId, message, durationMs) {

    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

    if (!isBotAdmin) {
        await sock.sendMessage(chatId, { text: '❌ Mets le bot admin d’abord.' }, { quoted: message });
        return;
    }

    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, { text: '❌ Seuls les admins du groupe peuvent utiliser cette commande.' }, { quoted: message });
        return;
    }

    try {
        // Fermer le groupe
        await sock.groupSettingUpdate(chatId, 'announcement');

        if (durationMs !== undefined && durationMs !== null && durationMs > 0) {

            await sock.sendMessage(
                chatId,
                { text: `🔒 Groupe fermé ✅\n⏳ Réouverture automatique dans *${formatDelay(durationMs)}*.` },
                { quoted: message }
            );

            setTimeout(async () => {
                try {
                    await sock.groupSettingUpdate(chatId, 'not_announcement');
                    await sock.sendMessage(chatId, { text: '🔓 Groupe rouvert ✅' });
                } catch (unmuteError) {
                    console.error('Error unmuting group:', unmuteError);
                }
            }, durationMs);

        } else {
            await sock.sendMessage(chatId, { text: '🔒 Groupe fermé ✅' }, { quoted: message });
        }

    } catch (error) {
        console.error('Error muting/unmuting the group:', error);
        await sock.sendMessage(chatId, { text: '❌ Une erreur est survenue. Réessaie.' }, { quoted: message });
    }
}

module.exports = muteCommand;
