// ✅ FIX Baileys ESM
async function getIsJidGroup() {
    const baileys = await import('@whiskeysockets/baileys');
    return baileys.isJidGroup;
}

module.exports = async function antilink(sock, message, chatId) {
    try {
        const isJidGroup = await getIsJidGroup();

        if (!isJidGroup(chatId)) return;

        const text = message.message?.conversation || 
                     message.message?.extendedTextMessage?.text || '';

        if (!text) return;

        if (text.includes('chat.whatsapp.com')) {
            await sock.sendMessage(chatId, { 
                text: '🚫 Anti-link activé !'
            });
        }

    } catch (err) {
        console.error(err);
    }
};
