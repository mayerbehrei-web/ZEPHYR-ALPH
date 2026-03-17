const axios = require("axios");
const settings = require("../settings");

function clean(s) {
  return String(s || "").trim();
}

function normalizeSpaces(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

// Trouve le 1er lien d'app dans la page "search" Play Store
function extractFirstPlayAppUrl(html) {
  const h = String(html || "");

  const m = h.match(/href="(\/store\/apps\/details\?id=[^"&]+[^"]*)"/i);
  if (m && m[1]) {
    const path = m[1].replace(/&amp;/g, "&");
    return "https://play.google.com" + path;
  }
  return null;
}

// Extrait infos depuis la page de l'app (best-effort)
function extractPlayDetails(html, fallbackName) {
  const h = String(html || "");

  const ogTitle = h.match(/property="og:title"\s*content="([^"]+)"/i);
  const title = normalizeSpaces(ogTitle ? ogTitle[1] : fallbackName);

  const ogImage = h.match(/property="og:image"\s*content="([^"]+)"/i);
  const icon = ogImage ? ogImage[1] : null;

  // developer
  let developer = null;
  const dev1 = h.match(/"developerName"\s*:\s*"([^"]+)"/i);
  if (dev1) developer = normalizeSpaces(dev1[1]);
  if (!developer) {
    const dev2 = h.match(/"By\s+([^"]+)"/i);
    if (dev2) developer = normalizeSpaces(dev2[1]);
  }

  // rating
  let rating = null;
  const r1 = h.match(/"starRating"\s*:\s*([0-9.]+)/i);
  if (r1) rating = r1[1];
  if (!rating) {
    const r2 = h.match(/aria-label="Rated\s+([0-9.]+)\s+stars/i);
    if (r2) rating = r2[1];
  }

  // installs
  let installs = null;
  const ins = h.match(/"installs"\s*:\s*"([^"]+)"/i);
  if (ins) installs = normalizeSpaces(ins[1]);
  if (!installs) {
    const ins2 = h.match(/>\s*([0-9][0-9.,+ ]+)\s*downloads\s*</i);
    if (ins2) installs = normalizeSpaces(ins2[1]);
  }

  return { title, icon, developer, rating, installs };
}

async function apkCommand(sock, chatId, message) {
  try {
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      "";

    const q = clean(text.split(" ").slice(1).join(" "));
    const prefix = settings.prefix || ".";

    if (!q) {
      return await sock.sendMessage(
        chatId,
        {
          text:
`╭━━━〔 🛍️ PLAY STORE 〕━━━╮
┃ ❌ Donne le nom d’une application
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

Utilisation :
• ${prefix}apk whatsapp
• ${prefix}apk capcut

📌 Le bouton "Installer" ouvre le Play Store.`
        },
        { quoted: message }
      );
    }

    // reaction start
    try { await sock.sendMessage(chatId, { react: { text: "🔎", key: message.key } }); } catch {}

    // Recherche Play Store
    const searchUrl = `https://play.google.com/store/search?q=${encodeURIComponent(q)}&c=apps`;
    const sr = await axios.get(searchUrl, {
      timeout: 25000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      validateStatus: () => true,
    });

    if (sr.status < 200 || sr.status >= 300 || !sr.data) {
      try { await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); } catch {}
      return await sock.sendMessage(
        chatId,
        { text: `❌ Erreur recherche Play Store (HTTP ${sr.status}). Réessaie.` },
        { quoted: message }
      );
    }

    const appUrl = extractFirstPlayAppUrl(sr.data);
    if (!appUrl) {
      try { await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); } catch {}
      return await sock.sendMessage(
        chatId,
        { text: "❌ Aucune application trouvée sur Play Store. Essaie un autre nom." },
        { quoted: message }
      );
    }

    // Page app
    const ap = await axios.get(appUrl, {
      timeout: 25000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      validateStatus: () => true,
    });

    if (ap.status < 200 || ap.status >= 300 || !ap.data) {
      try { await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); } catch {}
      return await sock.sendMessage(
        chatId,
        { text: `❌ Erreur page Play Store (HTTP ${ap.status}).` },
        { quoted: message }
      );
    }

    const info = extractPlayDetails(ap.data, q);

    try { await sock.sendMessage(chatId, { react: { text: "🛍️", key: message.key } }); } catch {}

    const caption =
`╭━━━〔 🛍️ PLAY STORE 〕━━━╮
┃ 📱 App : *${info.title || q}*
┃ 👤 Dev : *${info.developer || "N/A"}*
┃ ⭐ Note : *${info.rating || "N/A"}*
┃ ⬇️ Installs : *${info.installs || "N/A"}*
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

🔗 Lien officiel :
${appUrl}

✨ 𝐈𝐍𝐅𝐈𝐍𝐈𝐗•𝐌𝐃`;

    // ✅ Bouton "Installer" (ouvre le Play Store)
    const buttonsMsg = {
      footer: "𝐈𝐍𝐅𝐈𝐍𝐈𝐗•𝐌𝐃",
      buttons: [
        {
          buttonId: "INSTALL_PLAYSTORE",
          buttonText: { displayText: "📥 Installer" },
          type: 1
        },
        {
          buttonId: "COPY_LINK",
          buttonText: { displayText: "🔗 Copier le lien" },
          type: 1
        }
      ],
      headerType: 1
    };

    // Envoie icône + caption + boutons
    if (info.icon) {
      await sock.sendMessage(
        chatId,
        { image: { url: info.icon }, caption, ...buttonsMsg },
        { quoted: message }
      );
    } else {
      await sock.sendMessage(
        chatId,
        { text: caption, ...buttonsMsg },
        { quoted: message }
      );
    }

    try { await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } }); } catch {}
  } catch (e) {
    console.error("apkCommand error:", e?.response?.data || e);
    try { await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); } catch {}
    await sock.sendMessage(
      chatId,
      { text: "❌ Erreur APK (Play Store). Réessaie avec un autre nom." },
      { quoted: message }
    );
  }
}

module.exports = apkCommand;
