import { InlineKeyboard } from "grammy";
import { MyContext } from "../bot";
import { Test } from "../tests";

async function showInterestMapResults(ctx: MyContext, test: Test) {
    const scores = ctx.session.scores!;
    let resultText = `✅ *Тест "${test.name}" завершен!*.\n\nНаибольшее количество плюсов свидетельствует о выраженности интереса к определённой области.\n\n*Ваши результаты:*\n`;

    scores.forEach((score, index) => {
        resultText += `*${test.data.scales[index]}*: ${score} балла(ов)\n`;
    });

    resultText += "\n\nВы можете начать заново, отправив команду /start.";
    await ctx.editMessageText(resultText, { parse_mode: "Markdown" });
    ctx.session = { currentTestId: null, currentQuestionIndex: null, scores: null };
}

export async function sendInterestMapQuestion(ctx: MyContext, test: Test, showBack = true, gradeGroup?: string, forceEdit = false) {
    const session = ctx.session;
    const questionIndex = session.currentQuestionIndex!;
    const group = gradeGroup || ctx.session.gradeGroup;

    if (questionIndex >= test.data.questions.length) {
        await showInterestMapResults(ctx, test);
        return;
    }

    const questionText = test.data.questions[questionIndex];
    const keyboard = new InlineKeyboard()
        .text("Очень нравится (++ )", `${test.id}:plusplus`).row()
        .text("Просто нравится (+)", `${test.id}:plus`).row()
        .text("Не нравится (-)", `${test.id}:minus`).row();
    if (showBack) {
        if (questionIndex === 0 && group) {
            keyboard.text("Назад", `back_to_tests:${group}`);
        } else if (questionIndex > 0) {
            keyboard.text("Назад", `back_interestmap`);
        }
    }

    const message = `*Нравится ли вам:*\n\n${questionText}`;

    if (questionIndex === 0 && !forceEdit) {
        await ctx.reply(message, { parse_mode: "Markdown", reply_markup: keyboard });
    } else {
        await ctx.editMessageText(message, { parse_mode: "Markdown", reply_markup: keyboard });
    }
}

export async function handleInterestMapAnswer(ctx: MyContext, test: Test) {
    await ctx.answerCallbackQuery();

    const session = ctx.session;
    const questionIndex = session.currentQuestionIndex!;
    if (!ctx.callbackQuery || !ctx.callbackQuery.data) {
        console.error("callbackQuery or callbackQuery.data is undefined");
        return;
    }
    const answer = ctx.callbackQuery.data!.split(':')[1];

    // Rollback if already answered (user changed answer)
    if (session.answers && session.answers[questionIndex] !== null) {
        const prevAnswer = session.answers[questionIndex];
        const prevScaleIndex = test.data.getScaleIndex(questionIndex);
        if (prevScaleIndex !== undefined) {
            if (prevAnswer === 'plusplus') session.scores![prevScaleIndex] -= 2;
            else if (prevAnswer === 'plus') session.scores![prevScaleIndex] -= 1;
        }
    }
    // Store answer
    if (session.answers) session.answers[questionIndex] = answer;
    if (answer === 'plusplus' || answer === 'plus') {
        const scaleIndex = test.data.getScaleIndex(questionIndex);
        if (scaleIndex !== undefined) {
            if (answer === 'plusplus') session.scores![scaleIndex] += 2;
            else if (answer === 'plus') session.scores![scaleIndex] += 1;
        }
    }
    session.currentQuestionIndex!++;
    await sendInterestMapQuestion(ctx, test);
}

// Handle back button in Interest Map
export async function handleInterestMapBack(ctx: MyContext, test: Test) {
    await ctx.answerCallbackQuery();
    if (ctx.session.currentQuestionIndex! > 0) {
        ctx.session.currentQuestionIndex!--;
        // Rollback score for the answer being undone
        const idx = ctx.session.currentQuestionIndex!;
        if (ctx.session.answers && ctx.session.answers[idx] !== null) {
            const prevAnswer = ctx.session.answers[idx];
            const prevScaleIndex = test.data.getScaleIndex(idx);
            if (prevScaleIndex !== undefined) {
                if (prevAnswer === 'plusplus') ctx.session.scores![prevScaleIndex] -= 2;
                else if (prevAnswer === 'plus') ctx.session.scores![prevScaleIndex] -= 1;
            }
            ctx.session.answers[idx] = null;
        }
        await sendInterestMapQuestion(ctx, test, true, undefined, true);
    }
}
