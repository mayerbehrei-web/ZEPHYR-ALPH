const { handleWelcome } = require('../lib/welcome');
const { isWelcomeOn, getWelcome } = require('../lib/index');
const { channelInfo } = require('../lib/messageConfig');
const fetch = require('node-fetch');

async function welcomeCommand(sock, chatId, message, match) {

    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { 
            text: '❌ Cette commande fonctionne uniquement dans les groupes.' 
        });
        return;
    }

    const text = message.message?.conversation ||
        message.message?.extendedTextMessage?.text || '';

    const matchText = text.split(' ').slice(1).join(' ');

    await handleWelcome(sock, chatId, message, matchText);
}



async function handleJoinEvent(sock, id, participants) {

    const isWelcomeEnabled = await isWelcomeOn(id);
    if (!isWelcomeEnabled) return;

    const customMessage = await getWelcome(id);

    const groupMetadata = await sock.groupMetadata(id);
    const groupName = groupMetadata.subject;
    const groupDesc = groupMetadata.desc || 'Aucune description disponible';
    const memberCount = groupMetadata.participants.length;


    for (const participant of participants) {
        try {

            const participantString =
                typeof participant === 'string'
                    ? participant
                    : (participant.id || participant.toString());

            const userNumber = participantString.split('@')[0];

            let displayName = userNumber;

            try {
                const groupParticipants = groupMetadata.participants;
                const userParticipant = groupParticipants.find(p => p.id === participantString);

                if (userParticipant?.name) {
                    displayName = userParticipant.name;
                }
            } catch {}


            let finalMessage;

            if (customMessage) {

                finalMessage = customMessage
                    .replace(/{user}/g, `@${displayName}`)
                    .replace(/{group}/g, groupName)
                    .replace(/{description}/g, groupDesc)
                    .replace(/{count}/g, String(memberCount));

            } else {

                finalMessage =
`╭━━━〔 🎉 BIENVENUE 〕━━━╮
┃ 👤 Nouveau : @${displayName}
┃ 👥 Membres : ${memberCount}
┃ 🏷️ Groupe : ${groupName}
╰━━━━━━━━━━━━━━━━━━━━╯

📝 Description :
${groupDesc}

✨ ZEPHYR•ALPH
> BY ZEPHYR`;
            }


            // ====== IMAGE AUTO ======

            try {

                let profilePicUrl = 'https://i.imgur.com/2wzGhpF.jpeg';

                try {
                    const profilePic = await sock.profilePictureUrl(participantString, 'image');
                    if (profilePic) profilePicUrl = profilePic;
                } catch {}

                const apiUrl =
`https://api.some-random-api.com/welcome/img/2/gaming3
?type=join
&username=${encodeURIComponent(displayName)}
&guildName=${encodeURIComponent(groupName)}
&memberCount=${memberCount}
&avatar=${encodeURIComponent(profilePicUrl)}`.replace(/\n/g,'');

                const response = await fetch(apiUrl);

                if (response.ok) {
                    const imageBuffer = await response.buffer();

                    await sock.sendMessage(id, {
                        image: imageBuffer,
                        caption: finalMessage,
                        mentions: [participantString],
                        ...channelInfo
                    });

                    continue;
                }

            } catch {
                console.log('Image welcome échouée, envoi texte');
            }


            await sock.sendMessage(id, {
                text: finalMessage,
                mentions: [participantString],
                ...channelInfo
            });

        } catch (error) {

            console.error('Erreur welcome:', error);

            const participantString =
                typeof participant === 'string'
                    ? participant
                    : (participant.id || participant.toString());

            const user = participantString.split('@')[0];

            await sock.sendMessage(id, {
                text: `👋 Bienvenue @${user}`,
                mentions: [participantString],
                ...channelInfo
            });
        }
    }
}

module.exports = { welcomeCommand, handleJoinEvent };
