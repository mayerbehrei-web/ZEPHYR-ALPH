const axios = require("axios");

function isUrl(u) {
  return typeof u === "string" && /^https?:\/\/\S+/i.test(u.trim());
}

function cleanUrl(u) {
  if (!isUrl(u)) return null;
  return u.trim().replace(/\s+/g, "");
}

async function getJson(url) {
  return axios.get(url, {
    timeout: 25000,
    headers: {
      accept: "application/json, text/plain, */*",
      "user-agent":
        "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
    validateStatus: () => true,
  });
}

async function facebookCommand(sock, chatId, message) {
  try {
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      "";

    const url = text.split(" ").slice(1).join(" ").trim();

    if (!url) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            "❌ Donne un lien Facebook.\nExemple : *.fb https://www.facebook.com/share/r/xxxx*",
        },
        { quoted: message }
      );
    }

    // Vérif simple (fb / fb.watch / share)
    const lower = url.toLowerCase();
    if (
      !lower.includes("facebook.com") &&
      !lower.includes("fb.watch") &&
      !lower.includes("m.facebook.com")
    ) {
      return await sock.sendMessage(
        chatId,
        { text: "❌ Ce n’est pas un lien Facebook valide." },
        { quoted: message }
      );
    }

    // Réaction "chargement" ✨
    try {
      await sock.sendMessage(chatId, { react: { text: "🔄", key: message.key } });
    } catch {}

    const apiUrl = `https://tele-social.vercel.app/down?url=${encodeURIComponent(
      url
    )}`;

    const res = await getJson(apiUrl);

    if (res.status < 200 || res.status >= 300) {
      try {
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
      } catch {}
      return await sock.sendMessage(
        chatId,
        { text: `❌ Erreur API (HTTP ${res.status}). Réessaie.` },
        { quoted: message }
      );
    }

    const root = res.data;

    // Tele-social: status true/false
    if (!root || root.status !== true || !root.data) {
      try {
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
      } catch {}
      return await sock.sendMessage(
        chatId,
        {
          text:
            "❌ Impossible de récupérer la vidéo.\nLa vidéo est peut-être privée ou le lien est invalide.",
        },
        { quoted: message }
      );
    }

    // Structure Facebook:
    // root.data.media.video
    // root.data.media.download
    const media = root.data.media || {};
    const videoUrl = cleanUrl(media.download) || cleanUrl(media.video);

    const thumb = cleanUrl(root.data.thumbnail);
    const platform = root.platform || "Facebook";

    if (!videoUrl) {
      try {
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
      } catch {}
      return await sock.sendMessage(
        chatId,
        { text: "❌ Aucun lien vidéo téléchargeable trouvé." },
        { quoted: message }
      );
    }

    const caption =
      `╭━━━〔 📥 ${platform.toUpperCase()} 〕━━━╮\n` +
      `┃ ✅ Téléchargement réussi\n` +
      (thumb ? `┃ 🖼️ Miniature : OK\n` : `┃ 🖼️ Miniature : N/A\n`) +
      `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
      `🌬️ 𝐙𝐄𝐏𝐇𝐘𝐑•𝐀𝐋𝐏𝐇\n` +
      `> PAR ZEPHYR`;

    // Envoi direct de la vidéo 🥶
    await sock.sendMessage(
      chatId,
      {
        video: { url: videoUrl },
        mimetype: "video/mp4",
        caption,
        ...(thumb ? { jpegThumbnail: await fetchThumbAsBuffer(thumb) } : {}),
      },
      { quoted: message }
    );

    // Réaction OK
    try {
      await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
    } catch {}
  } catch (e) {
    console.error("facebookCommand error:", e?.response?.data || e);

    try {
      await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    } catch {}

    await sock.sendMessage(
      chatId,
      { text: "❌ Erreur Facebook. Réessaie plus tard." },
      { quoted: message }
    );
  }
}

/**
 * Optionnel: mini-thumbnail WhatsApp (évite les erreurs si URL OK)
 * Si tu ne veux pas de thumbnail, supprime juste cette fonction
 * et supprime la ligne jpegThumbnail plus haut. by rebelle masque 
 */
async function fetchThumbAsBuffer(url) {
  try {
    const r = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 15000,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
      validateStatus: () => true,
    });
    if (r.status >= 200 && r.status < 300 && r.data) return Buffer.from(r.data);
  } catch {}
  return undefined;
}

module.exports = facebookCommand;
