import { Bot, Context, session, SessionFlavor, InlineKeyboard } from "grammy";
import * as dotenv from 'dotenv';
import { tests, findTestById, Test } from './tests';
import { handleDdoAnswer, sendDdoQuestion, handleDdoBack } from "./handlers/ddoHandler";
import { handleInterestMapAnswer, sendInterestMapQuestion, handleInterestMapBack } from "./handlers/interestMapHandler";
import { handleYovaishaAnswer, sendYovaishaQuestion, handleYovaishaBack } from "./handlers/yovaishaHandler";

dotenv.config();

interface SessionData {
    currentTestId: string | null;
    currentQuestionIndex: number | null;
    scores: number[] | null;
    gradeGroup?: string | null;
}
export type MyContext = Context & SessionFlavor<SessionData>;

function initial(): SessionData {
    return { currentTestId: null, currentQuestionIndex: null, scores: null, gradeGroup: null };
}

const bot = new Bot<MyContext>(process.env.BOT_TOKEN || "");
bot.use(session({ initial }));

bot.command("start", async (ctx) => {
    ctx.session = initial();
    const keyboard = new InlineKeyboard()
        .text("1-4 классы", "select_grade:1-4").row()
        .text("5-7 классы", "select_grade:5-7").row()
        .text("8-9 классы", "select_grade:8-9").row()
        .text("10-11 классы", "select_grade:10-11");

    await ctx.reply("Здравствуйте! Я помогу вам определить профессиональные интересы и склонности. Пожалуйста, выберите вашу категорию (класс), чтобы я мог подобрать подходящие методики.", {
        reply_markup: keyboard,
    });
});

bot.callbackQuery('back_to_menu', async (ctx) => {
    ctx.session = initial();
    const keyboard = new InlineKeyboard()
        .text("1-4 классы", "select_grade:1-4").row()
        .text("5-7 классы", "select_grade:5-7").row()
        .text("8-9 классы", "select_grade:8-9").row()
        .text("10-11 классы", "select_grade:10-11");
    await ctx.editMessageText("Здравствуйте! Я помогу вам определить профессиональные интересы и склонности. Пожалуйста, выберите вашу категорию (класс), чтобы я мог подобрать подходящие методики.", {
        reply_markup: keyboard,
    });
});

bot.callbackQuery(/back_to_tests:(.+)/, async (ctx) => {
    const gradeGroup = ctx.match[1];
    const availableTests = tests.filter(t => t.grades.includes(gradeGroup));
    const keyboard = new InlineKeyboard();
    availableTests.forEach(test => {
        keyboard.text(test.name, `start_test:${test.id}`).row();
    });
    keyboard.text("Назад", "back_to_menu");
    await ctx.editMessageText("Отлично! Теперь выберите методику для прохождения:", {
        reply_markup: keyboard,
    });
});

bot.callbackQuery(/select_grade:(.+)/, async (ctx) => {
    const gradeGroup = ctx.match[1];
    const availableTests = tests.filter(t => t.grades.includes(gradeGroup));

    if (availableTests.length === 0) {
        await ctx.editMessageText("К сожалению, для этой группы классов пока нет методик.");
        return;
    }

    const keyboard = new InlineKeyboard();
    availableTests.forEach(test => {
        keyboard.text(test.name, `start_test:${test.id}`).row();
    });
    keyboard.text("Назад", "back_to_menu");

    await ctx.editMessageText("Отлично! Теперь выберите методику для прохождения:", {
        reply_markup: keyboard,
    });
});

bot.callbackQuery(/start_test:(.+)/, async (ctx) => {
    const testId = ctx.match[1];
    const test = findTestById(testId);

    if (!test) {
        await ctx.reply("Произошла ошибка, тест не найден.");
        return;
    }
    
    await ctx.answerCallbackQuery();
    
    if(ctx.message) {
        await ctx.deleteMessage();
    } else if (ctx.callbackQuery.message) {
        await ctx.api.deleteMessage(ctx.callbackQuery.message.chat.id, ctx.callbackQuery.message.message_id);
    }

    if (test.warning) {
        await ctx.reply(test.warning, { parse_mode: 'Markdown' });
    }
    
    ctx.session.currentTestId = test.id;
    ctx.session.currentQuestionIndex = 0;
    ctx.session.scores = Array(test.data.scales.length).fill(0);
    ctx.session.gradeGroup = test.grades[0];

    const gradeGroup = ctx.session.gradeGroup;

    if (test.id.startsWith('im')) {
        await sendInterestMapQuestion(ctx, test, true, gradeGroup);
    } else if (test.id === 'ddo') {
        await sendDdoQuestion(ctx, true, gradeGroup);
    } else if (test.id === 'yovaisha') {
        await sendYovaishaQuestion(ctx, true, gradeGroup);
    }
});

bot.callbackQuery(/ddo:(a|b)/, handleDdoAnswer);
bot.callbackQuery('back_ddo', handleDdoBack);

bot.callbackQuery(/yovaisha:(a|b|c)/, handleYovaishaAnswer);
bot.callbackQuery('back_yovaisha', handleYovaishaBack);

bot.callbackQuery(/im(5_7|8_9|10_11):(plusplus|plus|minus)/, async (ctx) => {
    const test = findTestById(ctx.session.currentTestId!);
    if (test) {
        await handleInterestMapAnswer(ctx, test);
    }
});
bot.callbackQuery('back_interestmap', async (ctx) => {
    const test = findTestById(ctx.session.currentTestId!);
    if (test) {
        await handleInterestMapBack(ctx, test);
    }
});

bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    console.error(e);
});

bot.start();
console.log("Бот запущен!");
