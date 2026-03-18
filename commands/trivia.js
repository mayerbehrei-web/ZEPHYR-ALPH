const axios = require('axios');

let triviaGames = {};

async function startTrivia(sock, chatId) {

    if (triviaGames[chatId]) {
        return sock.sendMessage(chatId, {
            text: "❌ Un quiz est déjà en cours dans ce groupe !"
        });
    }

    try {
        const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
        const data = response.data.results[0];

        // Mélanger les réponses
        const options = [...data.incorrect_answers, data.correct_answer].sort(() => Math.random() - 0.5);

        triviaGames[chatId] = {
            question: data.question,
            correctAnswer: data.correct_answer,
            options: options,
        };

        let optionsText = '';
        options.forEach((opt, i) => {
            optionsText += `${i + 1}. ${opt}\n`;
        });

        const message =
`╭──❏ 🎯 *QUIZ TRIVIA*
│ ❓ Question :
│ ${data.question}
│ 📋 Choix :
${optionsText}
│ ✍️ Réponds avec :
│ .answer <numéro>
╰──❏
> ZEPHYR•ALPH`;

        await sock.sendMessage(chatId, { text: message });

    } catch (error) {
        console.error('Trivia error:', error);
        await sock.sendMessage(chatId, {
            text: "❌ Erreur lors du chargement du quiz. Réessaie plus tard."
        });
    }
}


async function answerTrivia(sock, chatId, answer, message) {

    if (!triviaGames[chatId]) {
        return sock.sendMessage(chatId, {
            text: "⚠️ Aucun quiz en cours. Tape : .trivia"
        }, { quoted: message });
    }

    const game = triviaGames[chatId];
    const index = parseInt(answer) - 1;

    if (isNaN(index) || !game.options[index]) {
        return sock.sendMessage(chatId, {
            text: "❌ Réponse invalide.\nExemple : .answer 2"
        }, { quoted: message });
    }

    const userAnswer = game.options[index];

    if (userAnswer === game.correctAnswer) {

        await sock.sendMessage(chatId, {
            text:
`✅ *Bonne réponse !* 🎉

🏆 Réponse : ${game.correctAnswer}

Bien joué 👏`
        });

    } else {

        await sock.sendMessage(chatId, {
            text:
`❌ *Mauvaise réponse !*

📌 Bonne réponse :
👉 ${game.correctAnswer}

Essaie encore 😄`
        });
    }

    delete triviaGames[chatId];
}

module.exports = {
    startTrivia,
    answerTrivia
};
