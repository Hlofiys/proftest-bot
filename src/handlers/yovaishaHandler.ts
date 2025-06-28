import { InlineKeyboard } from "grammy";
import { MyContext } from "../bot";
import { questions, key, scales, getInterpretation, YOVAISHA_TEST_ID } from "../data/yovaishaTestData";

export async function sendYovaishaQuestion(ctx: MyContext, showBack = true, gradeGroup?: string, forceEdit = false) {
    const session = ctx.session;
    const questionIndex = session.currentQuestionIndex!;
    const group = ctx.session.gradeGroup || gradeGroup;

    if (questionIndex >= questions.length) {
        await showYovaishaResults(ctx);
        return;
    }

    const question = questions[questionIndex];
    const keyboard = new InlineKeyboard()
        .text("A", `${YOVAISHA_TEST_ID}:a`).row()
        .text("Б", `${YOVAISHA_TEST_ID}:b`).row()
        .text("В", `${YOVAISHA_TEST_ID}:c`).row();
    if (showBack) {
        if (questionIndex === 0 && group) {
            keyboard.text("Назад", `back_to_tests:${group}`);
        } else if (questionIndex > 0) {
            keyboard.text("Назад", `back_yovaisha`);
        }
    }

    const messageText = `*${question.text}*\n\n` +
        `а) ${question.options.a}\n` +
        `б) ${question.options.b}\n` +
        `в) ${question.options.c}`;

    if (questionIndex === 0 && !forceEdit) {
        await ctx.reply(messageText, { parse_mode: "Markdown", reply_markup: keyboard });
    } else {
        await ctx.editMessageText(messageText, { parse_mode: "Markdown", reply_markup: keyboard });
    }
}

export async function handleYovaishaAnswer(ctx: MyContext) {
    await ctx.answerCallbackQuery();

    const session = ctx.session;
    const questionIndex = session.currentQuestionIndex!;
    if (!ctx.callbackQuery || !ctx.callbackQuery.data) {
        console.error("callbackQuery or callbackQuery.data is undefined");
        return;
    }
    const answer = ctx.callbackQuery.data!.split(':')[1] as 'a' | 'b' | 'c';
    
    const scaleIndex = key[questionIndex][answer];
    session.scores![scaleIndex]++;
    session.currentQuestionIndex!++;
    
    await sendYovaishaQuestion(ctx);
}

// Handle back button in Yovaisha
export async function handleYovaishaBack(ctx: MyContext) {
    await ctx.answerCallbackQuery();
    if (ctx.session.currentQuestionIndex! > 0) {
        ctx.session.currentQuestionIndex!--;
        await sendYovaishaQuestion(ctx, true, undefined, true);
    }
}

async function showYovaishaResults(ctx: MyContext) {
    const scores = ctx.session.scores!;
    let resultText = "✅ *Тест Йовайши завершен! Ваши результаты:*\n\n";

    scores.forEach((score, index) => {
        const scaleName = scales[index];
        const interpretation = getInterpretation(score);
        resultText += `*${scaleName}*:\n`;
        resultText += `  Баллы: ${score}. Склонность *${interpretation}*.\n\n`;
    });

    resultText += "Вы можете начать заново, отправив команду /start.";

    await ctx.editMessageText(resultText, { parse_mode: "Markdown" });
    ctx.session = { currentTestId: null, currentQuestionIndex: null, scores: null };
}
