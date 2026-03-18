const settings = {
  packname: '𝐙𝐄𝐏𝐇𝐘𝐑•𝐀𝐋𝐏𝐇',
  author: 'zephyr',
  botName: "𝐙𝐄𝐏𝐇𝐘𝐑•𝐀𝐋𝐏𝐇",
  botOwner: 'zephyr', // ton nom
  ownerNumber: '237673560871', //Saisissez votre numéro ici, sans le symbole +. Indiquez simplement l'indicatif du pays et le numéro, sans espace.
  giphyApiKey: 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  commandMode: "public",
  maxStoreMessages: 20, 
  storeWriteInterval: 10000,
  description: "Bot WhatsApp Multi-Device pour la gestion de groupes et l’automatisation.",
  version: "3.0.2",
  updateZipUrl: "https://github.com/mayerbehrei-web/ZEPHYR-ALPH/archive/refs/heads/main.zip",
};

module.exports = settings;


// ajouté vautre prefix setting
module.exports.prefix = process.env.PREFIX || 'zh';

// Anti-mention de masse (suppression auto)
module.exports.antiMention = { enabled: false, threshold: 5, adminBypass: true };
//zphyr 🌬️
