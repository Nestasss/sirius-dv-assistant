require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const WEBHOOK_URL = 'https://notificbot.ru/webhook/sirius-assistant';

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `
Привет! 👋 Я AI-ассистент SiriusDV.

🔍 /search - поиск авто
💰 /price - расчёт стоимости
📍 /delivery - цены доставки
📞 /contact - контакты

Или просто напишите, какое авто ищите!
  `);
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  if (msg.text.startsWith('/')) return;

  await bot.sendChatAction(chatId, 'typing');

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg.text,
        user_id: `tg_${msg.from.id}`
      })
    });

    const data = await response.json();
    await bot.sendMessage(chatId, data.message || 'Ошибка обработки');
  } catch (error) {
    console.error(error);
    await bot.sendMessage(chatId, '❌ Ошибка соединения');
  }
});

console.log('🤖 Telegram Bot запущен');
