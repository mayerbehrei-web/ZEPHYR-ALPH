const axios = require('axios');
const settings = require('../settings');

function extractPinterestUrl(text) {
  if (!text) return null;
  const t = String(text).trim();

  // pinterest pin
  let m = t.match(/https?:\/\/[^\s]*pinterest[^\s]*\/pin\/[^\s]+/i);
  if (m) return m[0];

  // pin.it short
  m = t.match(/https?:\/\/pin\.it\/[^\s]+/i);
  if (m) return m[0];

  m = t.match(/pin\.it\/[^\s]+/i);
  if (m) return "https://" + m[0];

  return null;
}

function captionStyle({ title, author }) {
  const botName = settings.botName || '𝐙𝐄𝐏𝐇𝐘𝐑•𝐀𝐋𝐏𝐇';
  return (
`╭━━━〔 📌 PINTEREST 〕━━━╮
┃ 👤 Auteur : \`${author || 'N/A'}\`
╰━━━━━━━━━━━━━━━━━━━━━━╯

📝 *Titre :*
${title || 'Pinterest Pin'}

✨ ${botName}
> BY ZEPHYR`
  );
}

async function pinterestCommand(sock, chatId, message) {
  try {
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      "";

    const args = text.split(" ").slice(1).join(" ").trim();
    const pinUrl = extractPinterestUrl(args || text);

    if (!pinUrl) {
      const prefix = settings.prefix || '.';
      return await sock.sendMessage(chatId, {
        text:
`╭━━━〔 📌 PINTEREST 〕━━━╮
┃ ❌ Lien Pinterest manquant
╰━━━━━━━━━━━━━━━━━━━━━━╯

Utilisation :
• ${prefix}pinterest <lien Pinterest>

Exemples :
• ${prefix}pinterest https://www.pinterest.com/pin/1109363320773690068/
• ${prefix}pinterest https://pin.it/xxxxxx`
      }, { quoted: message });
    }

    // reaction start
    try { await sock.sendMessage(chatId, { react: { text: "📥", key: message.key } }); } catch {}

    const apiUrl = `https://api.nexray.web.id/downloader/pinterest?url=${encodeURIComponent(pinUrl)}`;
    const res = await axios.get(apiUrl, { timeout: 30000, validateStatus: () => true });

    if (res.status < 200 || res.status >= 300) {
      try { await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); } catch {}
      return await sock.sendMessage(chatId, { text: `❌ Erreur API Pinterest (HTTP ${res.status}). Réessaie.` }, { quoted: message });
    }

    const root = res.data;
    if (!root || root.status !== true || !root.result) {
      try { await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); } catch {}
      return await sock.sendMessage(chatId, { text: `❌ Réponse invalide. Le pin est peut-être privé ou supprimé.` }, { quoted: message });
    }

    const d = root.result;
    const isVideo = !!d.video;
    const mediaUrl = d.video || d.image || d.url;
    if (!mediaUrl) {
      try { await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); } catch {}
      return await sock.sendMessage(chatId, { text: `❌ Aucun média trouvé.` }, { quoted: message });
    }

    const cap = captionStyle({ title: d.title, author: d.author });

    if (isVideo) {
      // Download then send buffer (tokenized urls can expire)
      const vr = await axios.get(mediaUrl, {
        responseType: "arraybuffer",
        timeout: 120000,
        maxContentLength: 110 * 1024 * 1024,
        headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://www.pinterest.com/" },
        validateStatus: () => true
      });

      if (vr.status < 200 || vr.status >= 300 || !vr.data) {
        try { await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); } catch {}
        return await sock.sendMessage(chatId, { text: `❌ Impossible de télécharger la vidéo Pinterest.` }, { quoted: message });
      }

      await sock.sendMessage(chatId, { video: Buffer.from(vr.data), caption: cap }, { quoted: message });
    } else {
      await sock.sendMessage(chatId, { image: { url: mediaUrl }, caption: cap }, { quoted: message });
    }

    try { await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } }); } catch {}
  } catch (e) {
    console.error("pinterestCommand error:", e?.response?.data || e);
    try { await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); } catch {}
    await sock.sendMessage(chatId, { text: "❌ Erreur Pinterest. Réessaie plus tard." }, { quoted: message });
  }
}

module.exports = pinterestCommand;
