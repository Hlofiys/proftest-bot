import { InlineKeyboard } from "grammy";
import { MyContext } from "../bot";
import { questions, key, scales, DDO_TEST_ID } from "../data/ddoTestData";

export async function sendDdoQuestion(ctx: MyContext, showBack = true, gradeGroup?: string, forceEdit = false) {
    const session = ctx.session;
    const questionIndex = session.currentQuestionIndex!;
    const group = ctx.session.gradeGroup || gradeGroup;

    if (questionIndex >= questions.length) {
        await showDdoResults(ctx);
        return;
    }

    const question = questions[questionIndex];
    const keyboard = new InlineKeyboard()
        .text("А", `${DDO_TEST_ID}:a`)
        .text("Б", `${DDO_TEST_ID}:b`).row();
    if (showBack) {
        if (questionIndex === 0 && group) {
            keyboard.text("Назад", `back_to_tests:${group}`);
        } else if (questionIndex > 0) {
            keyboard.text("Назад", `back_ddo`);
        }
    }

    const messageText = `*${question.text}*\n\n` +
        `а) ${question.options.a}\n` +
        `б) ${question.options.b}`;

    if (questionIndex === 0 && !forceEdit) {
        await ctx.reply(messageText, { parse_mode: "Markdown", reply_markup: keyboard });
    } else {
        await ctx.editMessageText(messageText, { parse_mode: "Markdown", reply_markup: keyboard });
    }
}

export async function handleDdoAnswer(ctx: MyContext) {
    await ctx.answerCallbackQuery();

    const session = ctx.session;
    const questionIndex = session.currentQuestionIndex!;
    if (!ctx.callbackQuery || !ctx.callbackQuery.data) {
        console.error("callbackQuery or callbackQuery.data is undefined");
        return;
    }
    const answer = ctx.callbackQuery.data.split(':')[1] as 'a' | 'b';

    // Rollback if already answered (user changed answer)
    if (session.answers && session.answers[questionIndex] !== null) {
        const prevAnswer = session.answers[questionIndex] as 'a' | 'b';
        const prevScaleIndex = key[questionIndex][prevAnswer];
        session.scores![prevScaleIndex]--;
    }
    // Store answer
    if (session.answers) session.answers[questionIndex] = answer;
    const scaleIndex = key[questionIndex][answer];
    session.scores![scaleIndex]++;
    session.currentQuestionIndex!++;

    await sendDdoQuestion(ctx);
}

async function showDdoResults(ctx: MyContext) {
    const scores = ctx.session.scores!;
    let resultText = "✅ *Тест \"Я предпочту\" завершен!*\n\nВаши склонности:\n\n";

    const maxScore = Math.max(...scores);

    scores.forEach((score, index) => {
        resultText += `*${scales[index]}*: ${score} балла(ов)\n`;
    });

    resultText += "\n*Преобладающие интересы* (сферы с максимальным количеством баллов):\n";
    if (maxScore > 0) {
        const leadingInterests = scales.filter((_, index) => scores[index] === maxScore);
        resultText += `- ${leadingInterests.join('\n- ')}`;
    } else {
        resultText += "Ярко выраженные интересы не определены.";
    }

    resultText += "\n\nВы можете начать заново, отправив команду /start.";
    await ctx.editMessageText(resultText, { parse_mode: "Markdown" });
    ctx.session = { currentTestId: null, currentQuestionIndex: null, scores: null };
}

export async function handleDdoBack(ctx: MyContext) {
    await ctx.answerCallbackQuery();
    if (ctx.session.currentQuestionIndex! > 0) {
        ctx.session.currentQuestionIndex!--;
        // Rollback score for the answer being undone
        const idx = ctx.session.currentQuestionIndex!;
        if (ctx.session.answers && ctx.session.answers[idx] !== null) {
            const prevAnswer = ctx.session.answers[idx] as 'a' | 'b';
            const prevScaleIndex = key[idx][prevAnswer];
            ctx.session.scores![prevScaleIndex]--;
            ctx.session.answers[idx] = null;
        }
        await sendDdoQuestion(ctx, true, undefined, true);
    }
}
