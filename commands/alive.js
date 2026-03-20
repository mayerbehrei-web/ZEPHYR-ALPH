const settings = require("../settings");

async function aliveCommand(sock, chatId, message) {
    try {
        const version = settings?.version ? settings.version : "3.0.7";
        const mode = settings?.commandMode ? settings.commandMode : "public";

        const message1 = `
╭─────❏ 𝐙𝐄𝐏𝐇𝐘𝐑•𝐀𝐋𝐏𝐇
│ 🌟 *²⁰²⁶ Alive!* ✅
│ 🤖 𝐙𝐄𝐏𝐇𝐘𝐑•𝐀𝐋𝐏𝐇
│
│ \`Version\` : v${version} 📉
│ \`Statut\` : En ligne 🟢
│ \`Mode\` : ${mode} 🌐
│
│ \`🌟 Fonctions\`
│ • Gestion de groupes 👥
│ • Protection anti-lien 🔒
│ • Commandes admin 👮‍♂️
│ • Commandes fun 🎯
│ • Et plus encore ✨
│
│ Tape *.menu* pour voir la liste des commandes disponibles.
╰──────❏
›  • \`🌬️ZEPHYR\`
`.trim();

        await sock.sendMessage(chatId, {
            text: message1,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363403933773291@newsletter',
                    newsletterName: '𝐙𝐄𝐏𝐇𝐘𝐑•𝐀𝐋𝐏𝐇',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });

    } catch (error) {
        console.error('Error in alive command:', error);
        await sock.sendMessage(chatId, { text: 'Le bot est en ligne ✅' }, { quoted: message });
        return;
    }
}

module.exports = aliveCommand;
