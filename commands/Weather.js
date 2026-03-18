const axios = require('axios');
const fs = require('fs');
const path = require('path');

function normalizeCity(input) {
  if (!input) return '';
  return input
    .toString()
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

module.exports = async function (sock, chatId, message, city) {
  try {
    const apiKey = '4902c0f2550f58298ad4146a92b65e10';

    // ✅ Newsletter (transfert)
    const newsletterJid = '120363403933773291@newsletter';
    const newsletterName = '𝐙𝐄𝐏𝐇𝐘𝐑•𝐀𝐋𝐏𝐇';

    // ✅ Réaction
    try {
      await sock.sendMessage(chatId, { react: { text: '🌀', key: message.key } });
    } catch {}

    const cityName = normalizeCity(city);

    if (!cityName) {
      return await sock.sendMessage(
        chatId,
        { text: "❌ Exemple : .meteo abidjan / paris / dakar" },
        { quoted: message }
      );
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      cityName
    )}&appid=${apiKey}&units=metric&lang=fr`;

    const response = await axios.get(url);
    const weather = response.data;

    const ville = weather.name;
    const temp = Math.round(weather.main.temp);
    const feel = Math.round(weather.main.feels_like);
    const hum = weather.main.humidity;
    const vent = Math.round(weather.wind.speed * 3.6);
    const etat = weather.weather?.[0]?.description || 'inconnu';

    const weatherText =
      "╭━━〔 🌦️ MÉTÉO ☁️ 〕━╮\n\n" +
      "📍 Ville : `" + ville + "`\n" +
      "🌡️ Temp : `" + temp + "°C`\n" +
      "☀️ Ressenti : `" + feel + "°C`\n" +
      "💧 Humidité : `" + hum + "%`\n" +
      "🌬️ Vent : `" + vent + " km/h`\n" +
      "☁️ État : `" + etat + "`\n\n" +
      "𝐙𝐄𝐏𝐇𝐘𝐑•𝐀𝐋𝐏𝐇\n" +
      "╰━━━━━━━━━━━━━━━━━╯";

    // ✅ Image locale (comme help/menu)
    const imgPath = path.join(__dirname, '..', 'assets', 'meteo.jpg');
    const img = fs.existsSync(imgPath) ? fs.readFileSync(imgPath) : null;

    const contextInfo = {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid,
        newsletterName,
        serverMessageId: -1
      }
    };

    if (img) {
      await sock.sendMessage(
        chatId,
        {
          image: img,
          caption: weatherText,
          contextInfo
        },
        { quoted: message }
      );
    } else {
      await sock.sendMessage(
        chatId,
        {
          text: weatherText,
          contextInfo
        },
        { quoted: message }
      );
    }

  } catch (error) {
    console.error('Météo error:', error?.response?.data || error);

    if (error.response?.data?.cod === 404) {
      return await sock.sendMessage(
        chatId,
        { text: "❌ Ville introuvable.\n✅ Exemple : .meteo abidjan / dakar / paris" },
        { quoted: message }
      );
    }

    if (error.response?.data?.cod === 401) {
      return await sock.sendMessage(
        chatId,
        { text: "❌ Clé OpenWeather invalide.\n➡️ Vérifie ton apiKey." },
        { quoted: message }
      );
    }

    await sock.sendMessage(
      chatId,
      { text: "❌ Erreur météo. Réessaie plus tard." },
      { quoted: message }
    );
  }
};

// BY ZEPHYR 
// ZEPHYR ALPH
