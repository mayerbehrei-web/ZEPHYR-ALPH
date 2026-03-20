const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const { channelInfo } = require('../lib/messageConfig');

async function helpCommand(sock, chatId, message, channelLink) {
    // Dynamic USER
    const userName =
        message?.pushName ||
        message?.key?.participant?.split('@')?.[0] ||
        message?.key?.remoteJid?.split('@')?.[0] ||
        'User';

    // Dynamic MODE (PUBLIC / PRIVATE)
    const rawMode = (settings?.mode ?? settings?.MODE ?? '').toString().trim().toLowerCase();
    const mode = rawMode === 'private' ? 'PRIVATE' : 'PUBLIC';

    // Dynamic PREFIX
    const prefix = (settings?.prefix ?? settings?.PREFIX ?? settings?.handler ?? settings?.HANDLER ?? '.').toString();

    // RAM + Uptime
    const formatBytes = (bytes) => {
        if (!Number.isFinite(bytes) || bytes < 0) return '0 MB';
        const mb = bytes / (1024 * 1024);
        if (mb < 1024) return `${mb.toFixed(1)} MB`;
        return `${(mb / 1024).toFixed(2)} GB`;
    };

    const formatUptime = (seconds) => {
        seconds = Math.max(0, Math.floor(Number(seconds) || 0));
        const d = Math.floor(seconds / 86400);
        seconds %= 86400;
        const h = Math.floor(seconds / 3600);
        seconds %= 3600;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        const parts = [];
        if (d) parts.push(`${d}d`);
        if (h) parts.push(`${h}h`);
        if (m) parts.push(`${m}m`);
        parts.push(`${s}s`);
        return parts.join(' ');
    };

    const ram = formatBytes(process.memoryUsage()?.rss || 0);
    const uptime = formatUptime(process.uptime());

    const helpMessage = `‎*╭━━━🤖【  𝐙𝐄𝐏𝐇𝐘𝐑•𝐀𝐋𝐏𝐇】━━━┈⊷*
‎*┃〠╭──────────────────*
‎*┃〠│ 👤 𝚄𝚂𝙴𝚁 :❯ ${userName}*
‎*┃〠│ ${mode === 'PRIVATE' ? '🔒' : '🌐'} 𝙼𝙾𝙳𝙴 :❯ ${mode}*
‎*┃〠│ 🔰 𝙿𝚁𝙴𝙵𝙸𝚇 :❯ ${prefix}*
‎*┃〠│ 🧩 𝚅𝙴𝚁𝚂𝙸𝙾𝙽 :❯ ${settings.version || '3.0.7'}*
‎*┃〠│ 🧠 𝚁𝙰𝙼 :❯ ${ram}*
‎*┃〠│ ⏳ 𝚄𝙿𝚃𝙸𝙼𝙴 :❯ ${uptime}*
‎*┃❖╰──────────────────*
‎*╰━━━━━━━━━━━━━━━┈⊷*

📌  \`【 𝙼𝙴𝙽𝚄 𝙶𝙴𝙽𝙴𝚁𝙰𝙻 】\`
╭─────────────────────⊷
*┋ ➥ ${prefix}help*
*┋ ➥ ${prefix}menu*
*┋ ➥ ${prefix}ping*
*┋ ➥ ${prefix}alive*
*┋ ➥ ${prefix}tts*
*┋ ➥ ${prefix}owner*
*┋ ➥ ${prefix}joke*
*┋ ➥ ${prefix}quote*
*┋ ➥ ${prefix}fact*
*┋ ➥ ${prefix}meteo*
*┋ ➥ ${prefix}nouvelle*
*┋ ➥ ${prefix}attp*
*┋ ➥ ${prefix}lyrics*
*┋ ➥ ${prefix}8ball*
*┋ ➥ ${prefix}groupinfo*
*┋ ➥ ${prefix}staff*
*┋ ➥ ${prefix}admins*
*┋ ➥ ${prefix}vv*
*┋ ➥ ${prefix}trt*
*┋ ➥ ${prefix}ss*
*┋ ➥ ${prefix}jid*
*┋ ➥ ${prefix}url*
╰─────────────────────⊷

👮‍♂️  \`【 𝙰𝙳𝙼𝙸𝙽 】\`
╭─────────────────────⊷
*┋ ➥ ${prefix}ban*
*┋ ➥ ${prefix}promote*
*┋ ➥ ${prefix}demote*
*┋ ➥ ${prefix}close*
*┋ ➥ ${prefix}open*
*┋ ➥ ${prefix}delete*
*┋ ➥ ${prefix}del*
*┋ ➥ ${prefix}kick @user*
*┋ ➥ ${prefix}warnings @user*
*┋ ➥ ${prefix}warn @user*
*┋ ➥ ${prefix}antilink*
*┋ ➥ ${prefix}antibadword*
*┋ ➥ ${prefix}clear*
*┋ ➥ ${prefix}tag <message>*
*┋ ➥ ${prefix}tagall*
*┋ ➥ ${prefix}tagnotadmin*
*┋ ➥ ${prefix}hidetag*
*┋ ➥ ${prefix}chatbot*
*┋ ➥ ${prefix}resetlink*
*┋ ➥ ${prefix}antitag*
*┋ ➥ ${prefix}welcome*
*┋ ➥ ${prefix}goodbyof*
*┋ ➥ ${prefix}setgdesc*
*┋ ➥ ${prefix}setgname*
*┋ ➥ ${prefix}setgpp*
╰─────────────────────⊷

🔒  \`【 𝙾𝚆𝙽𝙴𝚁 】\`
╭─────────────────────⊷
*┋ ➥ ${prefix}mode*
*┋ ➥ ${prefix}clearsession*
*┋ ➥ ${prefix}antidelete*
*┋ ➥ ${prefix}cleartmp*
*┋ ➥ ${prefix}update*
*┋ ➥ ${prefix}settings*
*┋ ➥ ${prefix}setpp*
*┋ ➥ ${prefix}autoreact*
*┋ ➥ ${prefix}autostatus*
*┋ ➥ ${prefix}autostatus react*
*┋ ➥ ${prefix}autotyping*
*┋ ➥ ${prefix}autoread*
*┋ ➥ ${prefix}anticall*
*┋ ➥ ${prefix}pmblocker*
*┋ ➥ ${prefix}pmblocker setmsg*
*┋ ➥ ${prefix}setmention*
*┋ ➥ ${prefix}mention*
╰─────────────────────⊷

🎨  \`【 𝙸𝙼𝙰𝙶𝙴𝚂 & 𝚂𝚃𝙸𝙲𝙺𝙴𝚁𝚂 】\`
╭─────────────────────⊷
*┋ ➥ ${prefix}blur*
*┋ ➥ ${prefix}simage*
*┋ ➥ ${prefix}sticker*
*┋ ➥ ${prefix}removebg*
*┋ ➥ ${prefix}remini*
*┋ ➥ ${prefix}crop*
*┋ ➥ ${prefix}tgstickera*
*┋ ➥ ${prefix}meme*
*┋ ➥ ${prefix}take*
*┋ ➥ ${prefix}emojimix*
*┋ ➥ ${prefix}igs*
*┋ ➥ ${prefix}igsc*
╰─────────────────────⊷

🖼️  \`【 𝙿𝙸𝙴𝚂 】\`
╭─────────────────────⊷
*┋ ➥ ${prefix}pies*
*┋ ➥ ${prefix}china*
*┋ ➥ ${prefix}indonesia*
*┋ ➥ ${prefix}japan*
*┋ ➥ ${prefix}korea*
*┋ ➥ ${prefix}hijab*
╰─────────────────────⊷

🎮  \`【 𝙹𝙴𝚄𝚇 】\`
╭─────────────────────⊷
*┋ ➥ ${prefix}tictactoe*
*┋ ➥ ${prefix}hangman*
*┋ ➥ ${prefix}guess*
*┋ ➥ ${prefix}trivia*
*┋ ➥ ${prefix}answer*
*┋ ➥ ${prefix}truth*
*┋ ➥ ${prefix}dare*
╰─────────────────────⊷

🤖  \`【 𝙸𝙰 】\`
╭─────────────────────⊷
*┋ ➥ ${prefix}gpt*
*┋ ➥ ${prefix}gemini*
*┋ ➥ ${prefix}imagine*
*┋ ➥ ${prefix}flux*
*┋ ➥ ${prefix}sora*
╰─────────────────────⊷

🎯  \`【 𝙵𝚄𝙽 】\`
╭─────────────────────⊷
*┋ ➥ ${prefix}compliment*
*┋ ➥ ${prefix}insult*
*┋ ➥ ${prefix}flirt*
*┋ ➥ ${prefix}shayari*
*┋ ➥ ${prefix}goodnight*
*┋ ➥ ${prefix}roseday*
*┋ ➥ ${prefix}character*
*┋ ➥ ${prefix}wasted*
*┋ ➥ ${prefix}ship*
*┋ ➥ ${prefix}simp*
*┋ ➥ ${prefix}stupid*
╰─────────────────────⊷

🔤  \`【 𝚃𝙴𝚇𝚃𝙼𝙰𝙺𝙴𝚁 】\`
╭─────────────────────⊷
*┋ ➥ ${prefix}metallic*
*┋ ➥ ${prefix}ice*
*┋ ➥ ${prefix}snow*
*┋ ➥ ${prefix}impressive*
*┋ ➥ ${prefix}matrix*
*┋ ➥ ${prefix}light*
*┋ ➥ ${prefix}neon*
*┋ ➥ ${prefix}devil*
*┋ ➥ ${prefix}purple*
*┋ ➥ ${prefix}thunder*
*┋ ➥ ${prefix}leaves*
*┋ ➥ ${prefix}1917*
*┋ ➥ ${prefix}arena*
*┋ ➥ ${prefix}hacker*
*┋ ➥ ${prefix}sand*
*┋ ➥ ${prefix}blackpink*
*┋ ➥ ${prefix}glitch*
*┋ ➥ ${prefix}fire*
╰─────────────────────⊷

📥  \`【 𝚃𝙴𝙻𝙴𝙲𝙷𝙰𝚁𝙶𝙴𝙼𝙴𝙽𝚃𝚂 】\`
╭─────────────────────⊷
*┋ ➥ ${prefix}play*
*┋ ➥ ${prefix}song*
*┋ ➥ ${prefix}spotify*
*┋ ➥ ${prefix}instagram*
*┋ ➥ ${prefix}facebook*
*┋ ➥ ${prefix}tiktok*
*┋ ➥ ${prefix}apk*
*┋ ➥ ${prefix}pinterest*
*┋ ➥ ${prefix}video*
*┋ ➥ ${prefix}ytmp4*
╰─────────────────────⊷

🧩  \`【 𝙳𝙸𝚅𝙴𝚁𝚂 】\`
╭─────────────────────⊷
*┋ ➥ ${prefix}heart*
*┋ ➥ ${prefix}horny*
*┋ ➥ ${prefix}circle*
*┋ ➥ ${prefix}lgbt*
*┋ ➥ ${prefix}lolice*
*┋ ➥ ${prefix}its-so-stupid*
*┋ ➥ ${prefix}namecard*
*┋ ➥ ${prefix}oogway*
*┋ ➥ ${prefix}tweet*
*┋ ➥ ${prefix}ytcomment*
*┋ ➥ ${prefix}comrade*
*┋ ➥ ${prefix}gay*
*┋ ➥ ${prefix}glass*
*┋ ➥ ${prefix}jail*
*┋ ➥ ${prefix}passed*
*┋ ➥ ${prefix}triggered*
╰─────────────────────⊷

🖼️  \`【 𝙰𝙽𝙸𝙼𝙴 】\`
╭─────────────────────⊷
*┋ ➥ ${prefix}nom*
*┋ ➥ ${prefix}poke*
*┋ ➥ ${prefix}cry*
*┋ ➥ ${prefix}kiss*
*┋ ➥ ${prefix}pat*
*┋ ➥ ${prefix}hug*
*┋ ➥ ${prefix}wink*
*┋ ➥ ${prefix}facepalm*
╰─────────────────────⊷

💻  \`【 𝙶𝙸𝚃𝙷𝚄𝙱 】\`
╭─────────────────────⊷
*┋ ➥ ${prefix}git*
*┋ ➥ ${prefix}github*
*┋ ➥ ${prefix}sc*
*┋ ➥ ${prefix}script*
*┋ ➥ ${prefix}repo*
╰─────────────────────⊷

> 𝐏𝐎𝐰𝐞𝐫 𝐛𝐲 zephyr 🌬️`;

    try {
        const imgPath = path.join(__dirname, '..', 'assets', 'bot_image.jpg');
        const img = fs.existsSync(imgPath) ? fs.readFileSync(imgPath) : null;

        if (img) {
            await sock.sendMessage(
                chatId,
                { image: img, caption: helpMessage, ...channelInfo },
                { quoted: message }
            );
        } else {
            await sock.sendMessage(
                chatId,
                { text: helpMessage, ...channelInfo },
                { quoted: message }
            );
        }
    } catch (e) {
        await sock.sendMessage(
            chatId,
            { text: helpMessage, ...channelInfo },
            { quoted: message }
        );
    }
}

module.exports = helpCommand;
