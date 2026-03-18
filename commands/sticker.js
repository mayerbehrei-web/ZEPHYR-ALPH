// ✅ FIX import Baileys correctement
async function getDownloadMediaMessage() {
    const baileys = await import('@whiskeysockets/baileys');
    return baileys.downloadMediaMessage;
}

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const crypto = require('crypto');

// ✅ FIX node-webpmux fallback
let webp;
try {
    webp = require('node-webpmux');
} catch (e) {
    console.warn('⚠️ node-webpmux not installed, skipping EXIF metadata');
    webp = null;
}

async function stickerCommand(sock, chatId, message) {
    const messageToQuote = message;
    
    let targetMessage = message;

    if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        const quotedInfo = message.message.extendedTextMessage.contextInfo;
        targetMessage = {
            key: {
                remoteJid: chatId,
                id: quotedInfo.stanzaId,
                participant: quotedInfo.participant
            },
            message: quotedInfo.quotedMessage
        };
    }

    const mediaMessage = targetMessage.message?.imageMessage || targetMessage.message?.videoMessage || targetMessage.message?.documentMessage;

    if (!mediaMessage) {
        await sock.sendMessage(chatId, { 
            text: 'Reply to an image/video with .sticker'
        }, { quoted: messageToQuote });
        return;
    }

    try {
        // ✅ FIX utilisation correcte
        const downloadMediaMessage = await getDownloadMediaMessage();

        const mediaBuffer = await downloadMediaMessage(targetMessage, 'buffer', {}, { 
            logger: undefined, 
            reuploadRequest: sock.updateMediaMessage 
        });

        if (!mediaBuffer) {
            await sock.sendMessage(chatId, { text: 'Failed to download media.' });
            return;
        }

        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const tempInput = path.join(tmpDir, `temp_${Date.now()}`);
        const tempOutput = path.join(tmpDir, `sticker_${Date.now()}.webp`);

        fs.writeFileSync(tempInput, mediaBuffer);

        const isAnimated = mediaMessage.mimetype?.includes('gif') || 
                          mediaMessage.mimetype?.includes('video');

        const ffmpegCommand = isAnimated
            ? `ffmpeg -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -loop 0 "${tempOutput}"`
            : `ffmpeg -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp "${tempOutput}"`;

        await new Promise((resolve, reject) => {
            exec(ffmpegCommand, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        let finalBuffer = fs.readFileSync(tempOutput);

        // ✅ EXIF seulement si dispo
        if (webp) {
            try {
                const img = new webp.Image();
                await img.load(finalBuffer);

                const json = {
                    'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
                    'sticker-pack-name': settings.packname || 'Bot',
                    'emojis': ['🤖']
                };

                const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00]);
                const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
                img.exif = Buffer.concat([exifAttr, jsonBuffer]);

                finalBuffer = await img.save(null);
            } catch (e) {
                console.warn('EXIF skipped');
            }
        }

        await sock.sendMessage(chatId, { sticker: finalBuffer }, { quoted: messageToQuote });

        try {
            fs.unlinkSync(tempInput);
            fs.unlinkSync(tempOutput);
        } catch {}

    } catch (error) {
        console.error(error);
        await sock.sendMessage(chatId, { text: 'Failed to create sticker!' });
    }
}

module.exports = stickerCommand;
