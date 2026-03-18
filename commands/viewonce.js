const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { channelInfo } = require('../lib/messageConfig');

async function viewonceCommand(sock, chatId, message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedImage = quoted?.imageMessage;
    const quotedVideo = quoted?.videoMessage;

    const captionMsg = `╭─❏ 𝐙𝐄𝐏𝐇𝐘𝐑•𝐀𝐋𝐏𝐇
│✅ 𝘀𝘁𝗿𝗮𝘁𝗶𝗼𝗻 𝘁𝗲𝗿𝗺𝗶𝗻𝗲

  \`tu croyais cacher quoi 
  pathetique\`
  power by ZEPHYR`;

    try {
        if (quotedImage && quotedImage.viewOnce) {
            const stream = await downloadContentFromMessage(quotedImage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            await sock.sendMessage(
                chatId,
                { image: buffer, fileName: 'media.jpg', caption: captionMsg, ...channelInfo },
                { quoted: message }
            );
            return;
        }

        if (quotedVideo && quotedVideo.viewOnce) {
            const stream = await downloadContentFromMessage(quotedVideo, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            await sock.sendMessage(
                chatId,
                { video: buffer, fileName: 'media.mp4', caption: captionMsg, ...channelInfo },
                { quoted: message }
            );
            return;
        }

        await sock.sendMessage(
            chatId,
            { text: '❌ Réponds à une photo/vidéo (vue unique) avec .vv.', ...channelInfo },
            { quoted: message }
        );
    } catch (e) {
        await sock.sendMessage(
            chatId,
            { text: '❌ Erreur: impossible de récupérer le média vue unique.', ...channelInfo },
            { quoted: message }
        );
    }
}

module.exports = viewonceCommand;
