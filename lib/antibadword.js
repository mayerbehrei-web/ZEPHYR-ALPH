const { 
    setAntiBadword, 
    getAntiBadword, 
    removeAntiBadword, 
    incrementWarningCount, 
    resetWarningCount 
} = require('../lib/index');

/**
 * =========================
 *  CONFIG : .antibadword
 * =========================
 */
async function handleAntiBadwordCommand(sock, chatId, message, match) {
    // Cette commande doit être utilisée en groupe
    if (!chatId.endsWith('@g.us')) {
        return sock.sendMessage(chatId, {
            text:
`╭──❏ 🛡️ *ANTIBADWORD*
│
│ ❌ Cette commande marche uniquement en groupe.
╰──❏`
        }, { quoted: message });
    }

    // Aide
    if (!match) {
        return sock.sendMessage(chatId, {
            text:
`╭──❏ 🛡️ *ANTIBADWORD*
│
│ ✅ Activer :
│ *┋ ➥ .antibadword on*
│
│ ⚙️ Choisir l'action :
│ *┋ ➥ .antibadword set delete*  (supprime)
│ *┋ ➥ .antibadword set warn*    (avertit)
│ *┋ ➥ .antibadword set kick*    (expulse)
│
│ ⛔ Désactiver :
│ *┋ ➥ .antibadword off*
╰──❏`
        }, { quoted: message });
    }

    const arg = match.trim().toLowerCase();

    // ON
    if (arg === 'on') {
        const config = await getAntiBadword(chatId, 'on');
        if (config?.enabled) {
            return sock.sendMessage(chatId, {
                text:
`╭──❏ 🛡️ *ANTIBADWORD*
│ ✅ Déjà activé dans ce groupe.
╰──❏`
            }, { quoted: message });
        }
        // Par défaut : delete
        await setAntiBadword(chatId, 'on', 'delete');
        return sock.sendMessage(chatId, {
            text:
`╭──❏ 🛡️ *ANTIBADWORD*
│ ✅ Activé avec succès.
│ ⚙️ Action actuelle : *delete*
│
│ Change l'action :
│ *┋ ➥ .antibadword set warn*
│ *┋ ➥ .antibadword set kick*
╰──❏`
        }, { quoted: message });
    }

    // OFF
    if (arg === 'off') {
        const config = await getAntiBadword(chatId, 'on');
        if (!config?.enabled) {
            return sock.sendMessage(chatId, {
                text:
`╭──❏ 🛡️ *ANTIBADWORD*
│ ⚠️ Déjà désactivé.
╰──❏`
            }, { quoted: message });
        }
        await removeAntiBadword(chatId);
        return sock.sendMessage(chatId, {
            text:
`╭──❏ 🛡️ *ANTIBADWORD*
│ ❌ Désactivé dans ce groupe.
╰──❏`
        }, { quoted: message });
    }

    // SET ACTION
    if (arg.startsWith('set')) {
        const parts = arg.split(/\s+/);
        const action = parts[1];

        if (!action || !['delete', 'kick', 'warn'].includes(action)) {
            return sock.sendMessage(chatId, {
                text:
`╭──❏ 🛡️ *ANTIBADWORD*
│ ❌ Action invalide.
│ ✅ Choisis : *delete* / *warn* / *kick*
╰──❏`
            }, { quoted: message });
        }

        await setAntiBadword(chatId, 'on', action);
        return sock.sendMessage(chatId, {
            text:
`╭──❏ 🛡️ *ANTIBADWORD*
│ ✅ Action définie : *${action}*
╰──❏`
        }, { quoted: message });
    }

    return sock.sendMessage(chatId, {
        text:
`╭──❏ 🛡️ *ANTIBADWORD*
│ ❌ Commande invalide.
│ Tape : *.antibadword*
╰──❏`
    }, { quoted: message });
}

/**
 * =========================
 *  DÉTECTION AUTOMATIQUE
 * =========================
 */
async function handleBadwordDetection(sock, chatId, message, userMessage, senderId) {
    // Groupe uniquement
    if (!chatId.endsWith('@g.us')) return;

    // Ignore messages du bot
    if (message.key.fromMe) return;

    // Charger la config (source unique)
    const antiBadwordConfig = await getAntiBadword(chatId, 'on');
    if (!antiBadwordConfig?.enabled) return;

    // Convert message to lowercase and clean it
    const cleanMessage = (userMessage || '')
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!cleanMessage) return;

    // Liste existante (on garde pour ne rien casser)
    const badWords = [
        'gandu', 'madarchod', 'bhosdike', 'bsdk', 'fucker', 'bhosda', 
        'lauda', 'laude', 'betichod', 'chutiya', 'maa ki chut', 'behenchod', 
        'behen ki chut', 'tatto ke saudagar', 'machar ki jhant', 'jhant ka baal', 
        'randi', 'chuchi', 'boobs', 'boobies', 'tits', 'idiot', 'nigga', 'fuck', 
        'dick', 'bitch', 'bastard', 'asshole', 'asu', 'awyu', 'teri ma ki chut', 
        'teri maa ki', 'lund', 'lund ke baal', 'mc', 'lodu', 'benchod',
        'shit', 'damn', 'hell', 'piss', 'crap', 'slut', 'whore', 'prick',
        'motherfucker', 'cock', 'cunt', 'pussy', 'twat', 'wanker', 'douchebag', 'jackass', 
        'moron', 'retard', 'scumbag', 'skank', 'slutty', 'arse', 'bugger', 'sod off',
        'chut', 'laude ka baal', 'madar', 'behen ke lode', 'chodne', 'sala kutta',
        'harami', 'randi ki aulad', 'gaand mara', 'chodu', 'lund le', 'gandu saala',
        'kameena', 'haramzada', 'chamiya', 'chodne wala', 'chudai', 'chutiye ke baap',
        'fck', 'fckr', 'fcker', 'fuk', 'fukk', 'fcuk', 'btch', 'bch', 'bsdk', 'f*ck','assclown',
        'a**hole', 'f@ck', 'b!tch', 'd!ck', 'n!gga', 'f***er', 's***head', 'a$$', 'l0du', 'lund69',
        'spic', 'chink', 'cracker', 'towelhead', 'gook', 'kike', 'paki', 'honky', 
        'wetback', 'raghead', 'jungle bunny', 'sand nigger', 'beaner',
        'blowjob', 'handjob', 'cum', 'cumshot', 'jizz', 'deepthroat', 'fap', 
        'hentai', 'MILF', 'anal', 'orgasm', 'dildo', 'vibrator', 'gangbang', 
        'threesome', 'porn', 'sex', 'xxx',
        'fag', 'faggot', 'dyke', 'tranny', 'homo', 'sissy', 'fairy', 'lesbo',
        'weed', 'pot', 'coke', 'heroin', 'meth', 'crack', 'dope', 'bong', 'kush', 
        'hash', 'trip', 'rolling'
    ];

    const messageWords = cleanMessage.split(' ');
    let containsBadWord = false;

    for (const word of messageWords) {
        if (!word || word.length < 2) continue;

        if (badWords.includes(word)) {
            containsBadWord = true;
            break;
        }

        // Multi-words
        for (const badWord of badWords) {
            if (badWord.includes(' ') && cleanMessage.includes(badWord)) {
                containsBadWord = true;
                break;
            }
        }
        if (containsBadWord) break;
    }

    if (!containsBadWord) return;

    // Vérifier si le bot est admin
    let groupMetadata;
    try {
        groupMetadata = await sock.groupMetadata(chatId);
    } catch {
        return;
    }

    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const bot = groupMetadata.participants.find(p => p.id === botId);
    if (!bot?.admin) return;

    // Ne pas punir les admins
    const participant = groupMetadata.participants.find(p => p.id === senderId);
    if (participant?.admin) return;

    // Supprimer le message
    try {
        await sock.sendMessage(chatId, { delete: message.key });
    } catch {
        return;
    }

    // Appliquer l'action
    switch (antiBadwordConfig.action) {
        case 'delete':
            await sock.sendMessage(chatId, {
                text: `⚠️ @${senderId.split('@')[0]} langage interdit ici.`,
                mentions: [senderId]
            }, { quoted: message });
            break;

        case 'kick':
            try {
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                await sock.sendMessage(chatId, {
                    text: `🚫 @${senderId.split('@')[0]} expulsé (mauvais langage).`,
                    mentions: [senderId]
                }, { quoted: message });
            } catch (error) {
                console.error('Error kicking user:', error);
            }
            break;

        case 'warn':
            try {
                const warningCount = await incrementWarningCount(chatId, senderId);
                if (warningCount >= 3) {
                    await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                    await resetWarningCount(chatId, senderId);
                    await sock.sendMessage(chatId, {
                        text: `🚫 @${senderId.split('@')[0]} expulsé après *3 avertissements*.`,
                        mentions: [senderId]
                    }, { quoted: message });
                } else {
                    await sock.sendMessage(chatId, {
                        text: `⚠️ @${senderId.split('@')[0]} avertissement *${warningCount}/3* (langage interdit).`,
                        mentions: [senderId]
                    }, { quoted: message });
                }
            } catch (error) {
                console.error('Error warning/kicking user:', error);
            }
            break;

        default:
            // fallback
            await sock.sendMessage(chatId, {
                text: `⚠️ @${senderId.split('@')[0]} langage interdit ici.`,
                mentions: [senderId]
            }, { quoted: message });
            break;
    }
}

module.exports = {
    handleAntiBadwordCommand,
    handleBadwordDetection
};
