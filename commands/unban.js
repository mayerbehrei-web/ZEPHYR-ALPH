const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');
const isAdmin = require('../lib/isAdmin');
const { isSudo } = require('../lib/index');

async function unbanCommand(sock, chatId, message) {
    // Restrict in groups to admins; in private to owner/sudo
    const isGroup = chatId.endsWith('@g.us');
    if (isGroup) {
        const senderId = message.key.participant || message.key.remoteJid;
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { 
                text: '❌ Je dois être *admin* pour utiliser la commande `zhunban`.', 
                ...channelInfo 
            }, { quoted: message });
            return;
        }
        if (!isSenderAdmin && !message.key.fromMe) {
            await sock.sendMessage(chatId, { 
                text: '❌ Seuls les *admins du groupe* peuvent utiliser `zhunban`.', 
                ...channelInfo 
            }, { quoted: message });
            return;
        }
    } else {
        const senderId = message.key.participant || message.key.remoteJid;
        const senderIsSudo = await isSudo(senderId);
        if (!message.key.fromMe && !senderIsSudo) {
            await sock.sendMessage(chatId, { 
                text: '❌ En privé, seuls le *propriétaire/sudo* peuvent utiliser `zhunban`.', 
                ...channelInfo 
            }, { quoted: message });
            return;
        }
    }

    let userToUnban;

    // Check for mentioned users
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToUnban = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    // Check for replied message
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToUnban = message.message.extendedTextMessage.contextInfo.participant;
    }

    if (!userToUnban) {
        await sock.sendMessage(chatId, {
            text:
`╭───❏ 𝐙𝐄𝐏𝐇𝐘𝐑•𝐀𝐋𝐏𝐇
│ 🚫 \`Erreur\` : utilisateur non détecté
│ ✅ Utilise :
│ • \`.unban @user\`
│ • Ou réponds au message de la personne puis tape \`.unban\`
╰───❏
›  • \`ZEPHYR\``,
            ...channelInfo
        }, { quoted: message });
        return;
    }

    try {
        const bannedUsers = JSON.parse(fs.readFileSync('./data/banned.json'));
        const index = bannedUsers.indexOf(userToUnban);

        if (index > -1) {
            bannedUsers.splice(index, 1);
            fs.writeFileSync('./data/banned.json', JSON.stringify(bannedUsers, null, 2));

            await sock.sendMessage(chatId, {
                text:
`╭───❏ 𝐙𝐄𝐏𝐇𝐘𝐑•𝐀𝐋𝐏𝐇
│ ✅ \`Débannissement réussi\`
│ 👤 Utilisateur : @${userToUnban.split('@')[0]}
╰───❏
›  • \`ZEPHYR\``,
                mentions: [userToUnban],
                ...channelInfo
            }, { quoted: message });

        } else {
            await sock.sendMessage(chatId, {
                text:
`╭───❏ 𝐙𝐄𝐏𝐇𝐘𝐑•𝐀𝐋𝐏𝐇
│ ⚠️ \`Non banni\`
│ 👤 Utilisateur : @${userToUnban.split('@')[0]}
╰───❏
›  • \`ZEPHYR\``,
                mentions: [userToUnban],
                ...channelInfo
            }, { quoted: message });
        }

    } catch (error) {
        console.error('Error in unban command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Échec : impossible de débannir cet utilisateur.', 
            ...channelInfo 
        }, { quoted: message });
    }
}

module.exports = unbanCommand;
