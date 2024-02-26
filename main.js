import TelegramBot from "node-telegram-bot-api";
import timetable from "./middlewares/timetable.js";
import { config } from "dotenv";
config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Welcome to your timetable bot, /timetable");
}
);

//on /timetable command ask for class name, and then create timetable for that class name and send it to user and dott receive any message 
bot.onText(/\/timetable/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Please enter your class name");
    bot.once('message', async (msg) => {
        const className = msg.text;
        bot.sendMessage(chatId, `Creating timetable for ${className}`);
        await timetable({ className });
        bot.sendDocument(chatId, `./source/${className}.pdf`);
    });
}
);
