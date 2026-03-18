const axios = require("axios");
const settings = require("../settings");

function clean(s) {
  return String(s || "").trim();
}
function normalizeSpaces(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}
function fmt(v, fallback = "N/A") {
  const s = clean(v);
  return s ? s : fallback;
}
function safeFileName(name) {
  return String(name || "track").replace(/[\\/:*?"<>|]/g, "").slice(0, 60);
}

// Prend un champ qui peut être "artist/artists/artistes"
function pickArtists(obj) {
  return (
    clean(obj?.artists) ||
    clean(obj?.artist) ||
    clean(obj?.artistes) ||
    "N/A"
  );
}

// Tente de choisir une image cover (image/thumbnail/thumbnails)
function pickImage(obj) {
  return (
    clean(obj?.image) ||
    clean(obj?.thumbnail) ||
    clean(obj?.thumbnails) ||
    null
  );
}

// Tente de choisir un lien spotify (spotify_url/url_spotify/url)
function pickSpotifyUrl(obj) {
  return (
    clean(obj?.spotify_url) ||
    clean(obj?.url_spotify) ||
    clean(obj?.spotifyUrl) ||
    clean(obj?.url) ||
    ""
  );
}

// Tente de prendre une durée (duration/durée)
function pickDuration(obj) {
  return clean(obj?.duration) || clean(obj?.durée) || clean(obj?.duree) || "N/A";
}

// Optionnel: preview (si l’API le fournit)
function pickPreview(obj) {
  return clean(obj?.preview_url) || clean(obj?.preview) || clean(obj?.audio_preview) || "";
}

// L’API Flip peut renvoyer un JSON "cassé" parfois (mélange de champs).
// Ici on prend: data.results (array) ou data.result (object/array)
function pickFirstResult(data) {
  if (!data) return null;

  if (Array.isArray(data.results) && data.results.length) return data.results[0];
  if (Array.isArray(data.result) && data.result.length) return data.result[0];
  if (data.result && typeof data.result === "object") return data.result;

  // parfois "data" lui-même est un tableau
  if (Array.isArray(data) && data.length) return data[0];

  return null;
}

async function spotifyCommand(sock, chatId, message) {
  try {
    const rawText =
      clean(message.message?.conversation) ||
      clean(message.message?.extendedTextMessage?.text) ||
      clean(message.message?.imageMessage?.caption) ||
      clean(message.message?.videoMessage?.caption) ||
      "";

    const prefix = settings.prefix || ".";
    const used = (rawText.split(/\s+/)[0] || `${prefix}spotify`).trim();
    const query = clean(rawText.slice(used.length));

    if (!query) {
      return await sock.sendMessage(
        chatId,
        {
          text:
`╭━━━〔 🎧 SPOTIFY 〕━━━╮
┃ ❌ Donne un titre / artiste
╰━━━━━━━━━━━━━━━━━━━━━━╯

Utilisation :
• ${prefix}spotify bre petrunko
• ${prefix}spotify dadju - jaloux

✨ 𝐙𝐄𝐏𝐇𝐘𝐑•𝐀𝐋𝐏𝐇`,
        },
        { quoted: message }
      );
    }

    // reaction start
    try { await sock.sendMessage(chatId, { react: { text: "🔎", key: message.key } }); } catch {}

    const apiUrl = `https://spotify-search-flip.vercel.app/api?song=${encodeURIComponent(query)}`;
    const res = await axios.get(apiUrl, {
      timeout: 25000,
      headers: { "user-agent": "Mozilla/5.0" },
      validateStatus: () => true,
    });

    if (res.status < 200 || res.status >= 300) {
      try { await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); } catch {}
      return await sock.sendMessage(
        chatId,
        { text: `❌ Erreur API Spotify (HTTP ${res.status}). Réessaie.` },
        { quoted: message }
      );
    }

    const data = res.data;
    const r = pickFirstResult(data);

    if (!r) {
      try { await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); } catch {}
      return await sock.sendMessage(
        chatId,
        { text: "❌ Aucun résultat. Essaie un autre titre/artiste." },
        { quoted: message }
      );
    }

    const title = fmt(r.title || r.titre || r.name, "Titre inconnu");
    const artists = pickArtists(r);
    const duration = pickDuration(r);
    const date = fmt(r.releaseDate || r["date de sortie"] || r.date_de_sortie || r.release_date, "N/A");
    const spotifyUrl = pickSpotifyUrl(r);
    const imageUrl = pickImage(r);
    const previewUrl = pickPreview(r);

    const caption =
`╭━━━〔 🎧 SPOTIFY 〕━━━╮
┃ 🎵 Titre : *${normalizeSpaces(title)}*
┃ 👤 Artiste : *${normalizeSpaces(artists)}*
┃ ⏱ Durée : *${normalizeSpaces(duration)}*
┃ 📅 Sortie : *${normalizeSpaces(date)}*
╰━━━━━━━━━━━━━━━━━━━━━━╯
${spotifyUrl ? `\n🔗 Spotify :\n${spotifyUrl}\n` : ""}
✨ 𝐙𝐄𝐏𝐇𝐘𝐑•𝐀𝐋𝐏𝐇`;

    // Envoi cover + infos
    if (imageUrl) {
      await sock.sendMessage(chatId, { image: { url: imageUrl }, caption }, { quoted: message });
    } else {
      await sock.sendMessage(chatId, { text: caption }, { quoted: message });
    }

    // ✅ Si un preview officiel existe, on l’envoie (sinon on ne force pas)
    if (previewUrl) {
      try { await sock.sendMessage(chatId, { react: { text: "🎵", key: message.key } }); } catch {}

      await sock.sendMessage(
        chatId,
        {
          audio: { url: previewUrl },
          mimetype: "audio/mpeg",
          fileName: `${safeFileName(`${artists} - ${title}`)}.mp3`,
        },
        { quoted: message }
      );
    }

    try { await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } }); } catch {}
  } catch (error) {
    console.error("[SPOTIFY] error:", error?.response?.data || error?.message || error);
    try { await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } }); } catch {}
    await sock.sendMessage(
      chatId,
      { text: "❌ Erreur Spotify. Réessaie avec un autre titre/artiste." },
      { quoted: message }
    );
  }
}

module.exports = spotifyCommand;
