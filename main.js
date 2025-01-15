import fs from "fs";
import express from "express";
import { Telegraf, session, Scenes } from "telegraf";
import mongoose from "mongoose";
import { config } from "dotenv";
import Users from "./models/userModel.js";
import {timetableForStudent, timetableForTeacher} from "./middlewares/timetable.js";

config()


const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running...");
});

const bot = new Telegraf("7028762356:AAG2qCnrzgaa99LZJsB4VisIUyKNaMMmUVc");


const classNameScene = new Scenes.BaseScene("classNameScene");
const teacherNameScene = new Scenes.BaseScene("teacherNameScene");


classNameScene.enter((ctx) => {
  ctx.replyWithHTML(`<b>Qaysi guruhning dars jadvalini bilmoqchisiz? \n\n📌Eslatma: </b>\n<i>Guruhingizni <b>ST-63</b> kabi yozing!</i>`, {
    reply_markup: {

      inline_keyboard: [
        [
          {
            text: "🔙 Orqaga",
            callback_data: "back",
          }
        ]
      ],
    },

  });
});

teacherNameScene.enter((ctx) => {
  ctx.replyWithHTML(`<b>Qaysi o'qituvchining dars jadvalini bilmoqchisiz? \n\n📌Eslatma: </b>\n<i>Ismni saytda qanday bo'lsa shunday yozing!</i>`, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🔙 Orqaga",
            callback_data: "back",
          }
        ]
      ],
    },

  });
});

classNameScene.leave((ctx) => {
  if (ctx.session.className !== undefined) {
    ctx.replyWithHTML(`<b>${ctx.session.className} guruhining dars jadvali yuklanmoqda. \n\nIltimos kutib turing...</b>`);
  }
});

teacherNameScene.leave((ctx) => {
  if (ctx.session.teacherName !== undefined) {
    ctx.replyWithHTML(`<b>${ctx.session.teacherName}ning dars jadvali yuklanmoqda. \n\nIltimos kutib turing...</b>`);
  }
});

const menuItems = ["📅 Dars jadvali", "📞 Aloqa", "📝 Ma'lumot", "📊 Statistika"];

const requestQueue = [];
let isProcessing = false;

async function processQueue() {
  if (isProcessing || requestQueue.length === 0) {
    return;
  }

  isProcessing = true;
  const { ctx, type, name } = requestQueue.shift();

  try {
    if (type === "class") {
      await timetableForStudent({ className: name });
      let file = `./sources/${name}.pdf`;
      let dateTimeNow = new Date().toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" });

      if (fs.existsSync(file)) {
        ctx.replyWithDocument({
          source: file,
        }, {
          caption: `<i>📌${name} guruhining dars jadvali\n\nBoshqa guruh dars jadvalini olish uchun qaytadan \n"📅 Dars jadvali" tugmasini bosing!</i> \n\n<b>Sana: ${dateTimeNow.replaceAll("/", "-")}</b>`,
          parse_mode: "HTML",
        });
      } else {
        ctx.replyWithHTML("<b>❌Dars jadvali topilmadi. Iltimos, guruh nomini to'g'ri kiritganingizga ishonch hosil qilib, qaytadan urinib ko'ring!</b>");
      }
    } else if (type === "teacher") {
      await timetableForTeacher({ teacherName: name });
      let file = `./sources/${name}.pdf`;
      let dateTimeNow = new Date().toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" });

      if (fs.existsSync(file)) {
        ctx.replyWithDocument({
          source: file,
        }, {
          caption: `<i>📌${name}ning dars jadvali\n\nBoshqa dars jadvalini olish uchun qaytadan \n"📅 Dars jadvali" tugmasini bosing!</i> \n\n<b>Sana: ${dateTimeNow.replaceAll("/", "-")}</b>`,
          parse_mode: "HTML",
        });
      } else {
        ctx.replyWithHTML("<b>❌Dars jadvali topilmadi. Iltimos, ismni to'g'ri kiritganingizga ishonch hosil qilib, qaytadan urinib ko'ring!</b>");
      }
    }
  } catch (error) {
    console.log("Error: ", error);
  } finally {
    isProcessing = false;
    processQueue();
  }
}

classNameScene.on("text", async (ctx) => {
  ctx.session.className = ctx.message.text;
  console.log(ctx.session.className);

  const classNameRegex = /^[a-zA-Z]{1,3}-\d{2}$/;
  if (classNameRegex.test(ctx.session.className) && !menuItems.includes(ctx.message.text)) {
    ctx.scene.leave();
    requestQueue.push({ ctx, type: "class", name: ctx.session.className });
    processQueue();
  } else {
    ctx.replyWithHTML("<b>❌Noto'g'ri formatda kiritdingiz. \n\nIltimos, qaytadan urinib ko'ring!</b>");
    ctx.scene.leave();
  }
});

teacherNameScene.on("text", async (ctx) => {
  ctx.session.teacherName = ctx.message.text;
  console.log(ctx.session.teacherName);

  if (true) {
    ctx.scene.leave();
    requestQueue.push({ ctx, type: "teacher", name: ctx.session.teacherName });
    processQueue();
  } else {
    ctx.replyWithHTML("<b>❌Noto'g'ri formatda kiritdingiz. \n\nIltimos, qaytadan urinib ko'ring!</b>");
    ctx.scene.leave();
  }
});

bot.use(session());
const stage = new Scenes.Stage([classNameScene, teacherNameScene]);
bot.use(stage.middleware());

bot.on("message", async (ctx) => {
  const channel = process.env.CHANNEL;
  const chatMember = await ctx.telegram.getChatMember(channel, ctx.message.from.id);
  const isSubscribed = ["creator", "administrator", "member"].includes(chatMember.status);

  //check if user exists in database with telegram id
  const user = await Users.findOne({ id: ctx.from.id });
  if (!user) {
    await Users.create({
      id: ctx.from.id,
      firstname: ctx.from.first_name,
      username: ctx.from.username,
    });

  }


  try {
    if (!isSubscribed) {
      await ctx.replyWithHTML(`<b>Assalomu alaykum <a href='tg://user?id=${ctx.from.id}'>${ctx.from.first_name}</a> 😊 \nAfsuski, siz bizning kanalimizga a'zo bo'lmagansiz ☹️ Botdan foydalanish uchun pastdagi havola orqali kanalga a'zo bo'lib ✅ Tasdiqlash tugmasini bosing va\nqaytadan /start buyrug'ini jo'nating 😉</b>`, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📢 Kanalga obuna bo'lish",
                url: `https://t.me/${channel.replace("@", "")}`,
              },
            ],
            [
              {
                text: "✅ Tasdiqlash",
                callback_data: "check",
              }
            ]
          ],
        },
      });

    } else {
      if (ctx.message.text === "/start" && "🔙 Orqaga") {
        await ctx.replyWithHTML(`<b>Assalomu alaykum <a href='tg://user?id=${ctx.from.id}'>${ctx.from.first_name}</a> 😊\n \nSizga yordam bera olishim uchun pastdagi buyruqlardan birini tanlang 👇</b>`, {
          reply_markup: {
            resize_keyboard: true,
            keyboard: [
              ["📅 Dars jadvali", "📞 Aloqa"],
              ["📝 Ma'lumot", "📊 Statistika"],
            ],
          }
        });
      }

      if (ctx.message.text === "📅 Dars jadvali") {
        // ctx.scene.enter("classNameScene");
        ctx.replyWithHTML("Qanday dars jadvali olmoqchisiz?", {
          reply_markup: {
            resize_keyboard: true,
            keyboard: [
              ["🧑‍🎓 Guruh jadvali", "👨‍🏫 O'qituvchi jadvali"],
                ["🔙 Orqaga"],
            ],
            },
        })
      }

        if (ctx.message.text === "🧑‍🎓 Guruh jadvali") {
            ctx.scene.enter("classNameScene");
        }
        if (ctx.message.text === "👨‍🏫 O'qituvchi jadvali") {
            ctx.scene.enter("teacherNameScene");
        }

      if (ctx.message.text === "📞 Aloqa") {
        await ctx.replyWithHTML(`<i>🧑‍💻Shikoyatlar, dasturdagi xatoliklar va taklif uchun quyidagi manzillar orqali bog'lanishigiz mumkin:\n\n☎️ Telefon: +998-99-768-30-09\n\n✈️ Telegram: @mister_xurshidbey</i>`, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "✈️ Telegram",
                  url: "https://t.me/mister_xurshidbey",
                },

              ],
              [
                {
                  text: "🔙 Orqaga",
                  callback_data: "back",
                }
              ]
            ],
          },
        });
      }

      if (ctx.message.text === "📝 Ma'lumot") {
        await ctx.replyWithHTML(`<i>📌 Ushbu bot Raqamli Iqtisodiyot Fakulteti uchun maxsus yaratilgan!\n\n🧑‍💻 Dasturchi: @mister_xurshidbey\n\n📢 Kanal: @tsueitclub</i>`, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔙 Orqaga",
                  callback_data: "back"
                }
              ]
            ],
          },

        })
      }

      if (ctx.message.text === "🔙 Orqaga") {
        await ctx.replyWithHTML(`<b>Assalomu alaykum <a href='tg://user?id=${ctx.from.id}'>${ctx.from.first_name}</a> 😊\n \nSizga yordam bera olishim uchun pastdagi buyruqlardan birini tanlang 👇</b>`, {
          reply_markup: {
            resize_keyboard: true,
            keyboard: [
              ["📅 Dars jadvali", "📞 Aloqa"],
              ["📝 Ma'lumot", "📊 Statistika"],
            ],
          }
        });
      }

      if (ctx.message.text === "📊 Statistika") {
        const users = await Users.find();
        const usersCount = users.length;
        await ctx.replyWithHTML(`<i>📊 Botimiz foydalanuvchilari soni: <b>${usersCount}</b></i>`, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔙 Orqaga",
                  callback_data: "back",
                }
              ]
            ],
          },
        });
      }
    }

  } catch (error) {

  }


});

bot.action("check", async (ctx) => {
  const channel = process.env.CHANNEL;
  const chatMember = await ctx.telegram.getChatMember(channel, ctx.from.id);
  const isSubscribed = await ["creator", "administrator", "member"].includes(chatMember.status);

  if (isSubscribed) {
    //delete last message and welcome message
    await ctx.deleteMessage(
      ctx.callbackQuery.message.message_id

    );
    ctx.replyWithHTML("<i>Tabriklayman 😊 Siz kanalimizga a'zo bo'ldingiz 🎉. \n\nBotdan foydalanish uchun /start buyrug'ini jo'nating 😉</i>");
  } else {
    ctx.replyWithHTML("<i>Siz kanalga a'zo bo'lmadingiz 😔. \n\nIltimos, kanalga a'zo bo'lib qaytadan /start buyrug'ini jo'nating.</i>");
  }
});

bot.action("back", async (ctx) => {
  ctx.scene.leave();
  await ctx.deleteMessage(
    ctx.callbackQuery.message.message_id
  );
  await ctx.replyWithHTML(`<b>Assalomu alaykum <a href='tg://user?id=${ctx.from.id}'>${ctx.from.first_name}</a> 😊\n \nSizga yordam bera olishim uchun pastdagi buyruqlardan birini tanlang 👇</b>`, {
    reply_markup: {
      resize_keyboard: true,
      keyboard: [
        ["📅 Dars jadvali", "📞 Aloqa"],
        ["📝 Ma'lumot", "📊 Statistika"],
      ],
    }
  });
}
);

mongoose.connect(process.env.MONGO_URL).then(() => { console.log("MongoDB connected..."); }).catch((err) => console.log(err));


bot.launch();
