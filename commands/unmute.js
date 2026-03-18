async function unmuteCommand(sock, chatId, senderId, message, durationMs) {
    try {
        // Ouvrir le groupe
        await sock.groupSettingUpdate(chatId, 'not_announcement');

        if (durationMs !== undefined && durationMs !== null && durationMs > 0) {

            const totalSec = Math.round(durationMs / 1000);
            const delayText = totalSec < 60 ? `${totalSec}s` : `${Math.floor(totalSec / 60)}m${(totalSec % 60) ? ` ${totalSec % 60}s` : ''}`;

            await sock.sendMessage(chatId, { text: `🔓 Groupe ouvert ✅\n⏳ Fermeture automatique dans *${delayText}*.` }, message ? { quoted: message } : undefined);

            setTimeout(async () => {
                try {
                    await sock.groupSettingUpdate(chatId, 'announcement');
                    await sock.sendMessage(chatId, { text: '🔒 Groupe refermé ✅' });
                } catch (err) {
                    console.error('Error closing group:', err);
                }
            }, durationMs);

        } else {
            await sock.sendMessage(chatId, { text: '🔓 Groupe ouvert ✅' }, message ? { quoted: message } : undefined);
        }

    } catch (error) {
        console.error('Error opening group:', error);
        await sock.sendMessage(chatId, { text: '❌ Erreur lors de l’ouverture du groupe.' }, message ? { quoted: message } : undefined);
    }
}

module.exports = unmuteCommand;
