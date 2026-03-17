const axios = require('axios');
const { channelInfo } = require('../lib/messageConfig');

// Récupère le texte brut (message normal / reply / caption)
function getText(message) {
  return (
    message.message?.conversation ||
    message.message?.extendedTextMessage?.text ||
    message.message?.imageMessage?.caption ||
    message.message?.videoMessage?.caption ||
    ''
  );
}

function pickAnswer(data) {
  if (!data) return null;
  // formats fréquents
  return (
    data.answer ||
    data.response ||
    data.message ||
    data.result ||
    data.output ||
    data.data?.answer ||
    data.data?.response ||
    data.data?.message ||
    data.data?.result ||
    null
  );
}

async function tryGet(endpoint) {
  const res = await axios.get(endpoint, {
    timeout: 20000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      Accept: 'application/json,text/plain,*/*',
    },
    validateStatus: () => true,
  });

  // Texte brut
  if (typeof res.data === 'string') {
    const s = res.data.trim();
    return s.length > 2 ? s : null;
  }

  // JSON
  if (res.data && typeof res.data === 'object') {
    const ans = pickAnswer(res.data);
    if (typeof ans === 'string' && ans.trim().length > 2) return ans.trim();
  }

  return null;
}

async function aiCommand(sock, chatId, message) {
  try {
    const text = getText(message).trim();
    const parts = text.split(/\s+/);
    const cmd = (parts[0] || '').toLowerCase();
    const query = parts.slice(1).join(' ').trim();

    if (!query) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            "❌ Donne un texte à demander.\n\n✅ Exemples :\n• *.gpt c'est quoi un VPN ?*\n• *.gemini écris une bio WhatsApp stylée*",
          ...channelInfo,
        },
        { quoted: message }
      );
    }

    // Réaction "en cours"
    try {
      await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
    } catch {}

    await sock.sendMessage(
      chatId,
      { text: '🧠 Réflexion en cours...', ...channelInfo },
      { quoted: message }
    );

    // Endpoints (fallback). On ne crée PAS de nouvelles commandes.
    const endpoints = [];

    // Priorité "gemini" si la commande est .gemini
    if (cmd === '.gemini') {
      endpoints.push(`https://apis-keith.vercel.app/ai/gemini?q=${encodeURIComponent(query)}`);
    }

    // Fallback générique
    endpoints.push(
      `https://apis-keith.vercel.app/ai/gpt?q=${encodeURIComponent(query)}`,
      `https://api.giftedtechnexus.co.ke/api/ai/gpt?apikey=gifted&q=${encodeURIComponent(query)}`,
      `https://vihangayt.me/tools/chatgpt?q=${encodeURIComponent(query)}`,
      `https://api-rk.vercel.app/ai?q=${encodeURIComponent(query)}`,
      `https://api.lolhuman.xyz/api/openai?apikey=gatau&q=${encodeURIComponent(query)}`
    );

    let answer = null;
    let lastErr = null;

    for (const ep of endpoints) {
      try {
        const a = await tryGet(ep);
        if (a) {
          answer = a;
          break;
        }
        lastErr = new Error('Réponse vide');
      } catch (e) {
        lastErr = e;
      }
    }

    if (!answer) {
      try {
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
      } catch {}

      return await sock.sendMessage(
        chatId,
        {
          text:
            `❌ Impossible d'obtenir une réponse AI pour le moment.\n➡️ Réessaie dans 1 minute.` +
            (lastErr?.message ? `\n📝 Détail: ${lastErr.message}` : ''),
          ...channelInfo,
        },
        { quoted: message }
      );
    }

    // Sécurité: éviter les messages trop longs
    if (answer.length > 3500) answer = answer.slice(0, 3500) + '…';

    const header = cmd === '.gemini' ? '✨ GEMINI' : '🤖 GPT';
    const question = query.length > 350 ? query.slice(0, 350) + '…' : query;

    const styled =
      `╭━━━〔 ${header} 〕━━━╮\n` +
      `┃ 🗣️ Question :\n` +
      `┃ ${question}\n` +
      `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
      `${answer}\n\n` +
      `✨ INFINIX•MD\n` +
      `> BY REBELLE MASQUE`;

    await sock.sendMessage(chatId, { text: styled, ...channelInfo }, { quoted: message });

    try {
      await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } catch {}
  } catch (error) {
    console.error('Error in AI command:', error);
    try {
      await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    } catch {}
    await sock.sendMessage(
      chatId,
      { text: '❌ Erreur AI. Réessaie plus tard.', ...channelInfo },
      { quoted: message }
    );
  }
}

module.exports = aiCommand;
