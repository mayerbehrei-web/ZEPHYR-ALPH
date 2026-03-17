const axios = require('axios');
const settings = require('../settings');

function isUrl(u) {
  return typeof u === "string" && /^https?:\/\/\S+/i.test(u.trim());
}

async function apkdlCommand(sock, chatId, message) {
  try {
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const url = text.split(' ').slice(1).join(' ').trim();

    if (!url) {
      return sock.sendMessage(chatId, { text: `📥 Exemple : *${settings.prefix || '.'}apkdl https://site.com/app.apk*` }, { quoted: message });
    }

    if (!isUrl(url) || !url.toLowerCase().includes('.apk')) {
      return sock.sendMessage(chatId, { text: '❌ Donne un lien direct vers un fichier *.apk*.' }, { quoted: message });
    }

    try { await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } }); } catch {}

    // Taille (si dispo)
    let sizeMB = null;
    try {
      const head = await axios.head(url, { timeout: 15000, validateStatus: () => true });
      const len = head.headers?.['content-length'];
      if (len) sizeMB = Math.round((Number(len) / (1024*1024))*10)/10;
    } catch {}

    const MAX_MB = 50;
    if (sizeMB && sizeMB > MAX_MB) {
      try { await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } }); } catch {}
      return sock.sendMessage(chatId, { text: `❌ APK trop lourd (${sizeMB} MB). Limite: ${MAX_MB} MB.` }, { quoted: message });
    }

    const fileName = `app_${Date.now()}.apk`;
    const caption =
`╭━━━〔 📦 APK 〕━━━╮
┃ ✅ Téléchargement prêt
┃ 📁 Nom : ${fileName}
${sizeMB ? `┃ 📦 Taille : ${sizeMB} MB\n` : ''}╰━━━━━━━━━━━━━━━━━━━━╯
✨ INFINIX•MD`;

    await sock.sendMessage(chatId, {
      document: { url },
      fileName,
      mimetype: 'application/vnd.android.package-archive',
      caption
    }, { quoted: message });

    try { await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } }); } catch {}
  } catch (e) {
    console.error('apkdlCommand error:', e);
    try { await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } }); } catch {}
    return sock.sendMessage(chatId, { text: '❌ Erreur APKDL.' }, { quoted: message });
  }
}

module.exports = apkdlCommand;
