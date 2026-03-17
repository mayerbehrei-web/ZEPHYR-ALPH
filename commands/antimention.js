const settings = require('../settings');
const { setAntimention, getAntimention, removeAntimention } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');

async function antiMentionCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
  try {
    if (!chatId.endsWith('@g.us')) {
      return await sock.sendMessage(chatId, { text: '```Cette commande fonctionne seulement en groupe.```' }, { quoted: message });
    }

    // Admin only
    if (!isSenderAdmin) {
      const st = await isAdmin(sock, chatId, senderId);
      if (!st.isSenderAdmin) {
        return await sock.sendMessage(chatId, { text: '```For Group Admins Only!```' }, { quoted: message });
      }
    }

    const prefix = settings.prefix || '.';
    const args = userMessage.split(' ').slice(1);
    const sub = (args[0] || '').toLowerCase();

    const cfg = await getAntimention(chatId, 'on'); // returns config or null
    const enabled = !!cfg;

    const threshold = (settings.antiMention && Number(settings.antiMention.threshold)) || 5;
    const adminBypass = settings.antiMention?.adminBypass ?? true;

    if (!sub || !['on','off','status'].includes(sub)) {
      return await sock.sendMessage(chatId, {
        text:
`╭━━━〔 🛡️ ANTI-MENTION 〕━━━╮
┃ État : ${enabled ? 'ON ✅' : 'OFF ❌'}
┃ Seuil : ${threshold}
┃ Admin bypass : ${adminBypass ? 'ON' : 'OFF'}
╰━━━━━━━━━━━━━━━━━━━━━━╯

Utilisation :
• ${prefix}antimention on
• ${prefix}antimention off
• ${prefix}antimention status`
      }, { quoted: message });
    }

    if (sub === 'on') {
      await setAntimention(chatId, 'on', 'delete');
      return await sock.sendMessage(chatId, { text: '✅ Anti-mention activé.' }, { quoted: message });
    }

    if (sub === 'off') {
      await removeAntimention(chatId, 'off');
      return await sock.sendMessage(chatId, { text: '✅ Anti-mention désactivé.' }, { quoted: message });
    }

    // status
    return await sock.sendMessage(chatId, { text: `🛡️ Anti-mention : ${enabled ? 'ON ✅' : 'OFF ❌'}` }, { quoted: message });

  } catch (e) {
    console.error('antiMentionCommand error:', e);
    return await sock.sendMessage(chatId, { text: '❌ Erreur AntiMention.' }, { quoted: message });
  }
}

module.exports = antiMentionCommand;
