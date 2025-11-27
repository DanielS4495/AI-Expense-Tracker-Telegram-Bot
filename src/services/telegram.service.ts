import { Telegraf, Markup } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import { analyzeText } from './openai.service';

const prisma = new PrismaClient();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN as string);

// --- פונקציית עזר לעיצוב אחיד (כולל שעה ומיקום) ---
const formatExpense = (exp: any) => {
  const d = new Date(exp.expenseDate || exp.createdAt);
  const dateStr = d.toLocaleString('he-IL', { 
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false 
  }).replace(',', '');
  
  let locStr = '';
  if (exp.location && exp.location.toLowerCase() !== 'unknown' && exp.location.trim() !== '') {
      locStr = ` (${exp.location})`;
  }
  return `📌 <b>${exp.item}</b>${locStr} - ${exp.amount}₪ [${dateStr}]`;
};

// --- פונקציית עזר לחיפוש חכם (מתעלמת מגרשיים וסימנים) ---
const normalizeText = (str: string) => {
    return str.replace(/['"״׳-]/g, '').trim().toLowerCase();
};

// --- הודעת הפתיחה המושקעת ---
bot.start((ctx) => {
  const welcomeMessage = `
👋 <b>ברוכים הבאים ל-Expense Tracker!</b>

אני העוזר הפיננסי החכם שלך. אני יודע לנהל את ההוצאות שלך דרך שיחה טבעית בעברית. 🇮🇱💰

<b>מה אפשר להגיד לי?</b>
🍕 <b>הוספת הוצאה:</b>
• "קניתי פיצה ב-50"
• "סופר 400 שקל ודלק ב-200"
• "קניתי ג'ינס בזארה ב-300" (אני שומר גם מיקום ותאריך!)

📊 <b>דוחות וסיכומים:</b>
• "תביא דוח" או "רשימה"
• "מה היה המצב החודש?"

✏️ <b>תיקונים ומחיקות:</b>
• "תשנה את האחרון ל-100"
• "תמחק את הפיצה"
• "תשנה את התאריך של הג'ינס לאתמול ב-5"

🛠 <b>איפוס:</b>
• "תמחק הכל" (זהירות!)

👇 <b>כדי להתחיל, אני צריך לזהות אותך בצורה מאובטחת:</b>
אנא לחץ על הכפתור למטה לשתף את המספר שלך.
`;

  ctx.reply(welcomeMessage, {
    parse_mode: 'HTML',
    ...Markup.keyboard([
      Markup.button.contactRequest('📱 שתף מספר לאימות')
    ]).resize().oneTime()
  });
});

// --- הרשמה מאובטחת ---
bot.on('contact', async (ctx) => {
  const contact = ctx.message.contact;
  if (contact.user_id !== ctx.from.id) return ctx.reply('❌ שגיאת אבטחה: רק המספר שלך.');
  
  let phoneNumber = contact.phone_number;
  if (!phoneNumber.startsWith('+')) phoneNumber = '+' + phoneNumber;

  try {
    await prisma.user.upsert({ where: { phoneNumber }, update: { telegramChatId: ctx.chat.id.toString() }, create: { phoneNumber, telegramChatId: ctx.chat.id.toString() } });
    ctx.reply(`✅ נרשמת בהצלחה!\nהמספר המאומת: ${phoneNumber}\nהמקלדת הוסרה, אפשר להתחיל לכתוב.`, Markup.removeKeyboard());
  } catch (error) {
    console.error(error);
    ctx.reply('תקלה ברישום.');
  }
});

// --- המוח המרכזי ---
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const text = ctx.message.text.trim();

  const user = await prisma.user.findUnique({ where: { telegramChatId: chatId }, include: { conversation: true } });
  
  if (!user) {
    return ctx.reply('⚠️ לא מזוהה. לחץ על הכפתור למטה.', Markup.keyboard([Markup.button.contactRequest('📱 שתף מספר לאימות')]).resize().oneTime());
  }

  const processingMsg = await ctx.reply('🤔 מנתח...');
  
  try {
    let previousContext = null;
    if (user.conversation) {
        const diff = (new Date().getTime() - new Date(user.conversation.updatedAt).getTime()) / 60000;
        if (diff < 5) previousContext = JSON.parse(user.conversation.data);
        else await prisma.conversationState.delete({ where: { userId: user.id } });
    }

    const analysis = await analyzeText(text, previousContext);
    console.log('Action:', analysis.action);

    switch (analysis.action) {
      case 'ask_for_info':
        if (analysis.partial_data) {
            const merged = { ...previousContext, ...analysis.partial_data };
            await prisma.conversationState.upsert({
                where: { userId: user.id },
                update: { data: JSON.stringify(merged) },
                create: { userId: user.id, data: JSON.stringify(merged) }
            });
        }
        ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, analysis.question || 'חסרים פרטים.');
        break;

      case 'add_expense':
        if (analysis.expenses && analysis.expenses.length > 0) {
          let outputMsg = '<b>✅ נשמרו ההוצאות:</b>\n\n';
          let hasSuccess = false;

          for (const exp of analysis.expenses) {
             if (!exp.item || exp.item.trim().length < 2) continue;
             
             const d = exp.date ? new Date(exp.date) : new Date();
             if (d > new Date()) {
                 const niceDate = `${d.getDate()}/${d.getMonth()+1}`;
                 outputMsg += `❌ <b>${exp.item}</b>: שגיאה - תאריך עתידי (${niceDate}).\n\n`;
                 continue;
             }

             let finalLocation = (exp.location && exp.location.toLowerCase() !== 'unknown') ? exp.location : null;

             const newExp = await prisma.expense.create({
                data: { 
                    userId: user.id, 
                    item: exp.item, 
                    amount: exp.amount || 0, 
                    category: exp.category || 'כללי', 
                    location: finalLocation, 
                    expenseDate: d 
                }
             });
             outputMsg += `${formatExpense(newExp)}\n\n`;
             hasSuccess = true;
          }

          if (outputMsg) {
              ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, outputMsg, { parse_mode: 'HTML' });
              if (hasSuccess && user.conversation) await prisma.conversationState.delete({ where: { userId: user.id } }).catch(()=>{});
          } else {
              ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, 'לא נשמר כלום.');
          }
        } else {
            ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, 'לא זוהו נתונים.');
        }
        break;

      case 'list_expenses':
        const list = await prisma.expense.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
        if (list.length === 0) ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, 'היומן ריק.');
        else {
            const report = list.slice(0, 40).map(e => formatExpense(e)).join('\n\n');
            const total = list.reduce((sum, e) => sum + e.amount, 0);
            const suffix = list.length > 40 ? `\n\n<i>(מציג 40 מתוך ${list.length})</i>` : '';
            ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, `📊 <b>רשימת ההוצאות המלאה:</b>\n\n${report}${suffix}\n\n🏁 <b>סה"כ הכל: ${total}₪</b>`, { parse_mode: 'HTML' });
        }
        if (user.conversation) await prisma.conversationState.delete({ where: { userId: user.id } }).catch(()=>{});
        break;

      case 'update_last_expense':
        const lastToUpdate = await prisma.expense.findFirst({ where: { userId: user.id }, orderBy: { id: 'desc' } });
        if (lastToUpdate) {
             const data: any = {};
             if (analysis.new_amount !== undefined) data.amount = analysis.new_amount;
             if (analysis.new_item) data.item = analysis.new_item;
             if (analysis.new_location) data.location = analysis.new_location;
             if (analysis.new_date) {
                 const d = new Date(analysis.new_date);
                 if (!isNaN(d.getTime()) && d <= new Date()) data.expenseDate = d;
                 else if (d > new Date()) { ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, '❌ תאריך עתידי.'); return; }
             }
             const updated = await prisma.expense.update({ where: { id: lastToUpdate.id }, data });
             ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, `<b>✅ עודכן:</b>\n\n${formatExpense(updated)}`, { parse_mode: 'HTML' });
        } else {
             ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, 'אין מה לעדכן.');
        }
        if (user.conversation) await prisma.conversationState.delete({ where: { userId: user.id } }).catch(()=>{});
        break;

      case 'update_expense':
        if (analysis.search_term) {
           const cleanSearch = normalizeText(analysis.search_term);
           const items = await prisma.expense.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 50 });
           
           const item = items.find(e => normalizeText(e.item).includes(cleanSearch));

           if (item) {
               const data: any = {};
               if (analysis.new_amount !== undefined && analysis.new_amount !== null) data.amount = analysis.new_amount;
               if (analysis.new_item && analysis.new_item.trim() !== '') data.item = analysis.new_item;
               if (analysis.new_location && analysis.new_location.trim() !== '') data.location = analysis.new_location;

               if (analysis.new_date) {
                   const d = new Date(analysis.new_date);
                   if (!isNaN(d.getTime()) && d <= new Date()) data.expenseDate = d;
                   else if (d > new Date()) { ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, '❌ תאריך עתידי.'); return; }
               }
               
               if (Object.keys(data).length > 0) {
                   const updated = await prisma.expense.update({ where: { id: item.id }, data });
                   ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, `<b>✅ עודכן:</b>\n\n${formatExpense(updated)}`, { parse_mode: 'HTML' });
               } else {
                   ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, 'לא זיהיתי נתונים לשינוי.');
               }
           } else {
               ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, `לא מצאתי את "${analysis.search_term}".`);
           }
        }
        if (user.conversation) await prisma.conversationState.delete({ where: { userId: user.id } }).catch(()=>{});
        break;

      case 'delete_last_expense':
        const last = await prisma.expense.findFirst({ where: { userId: user.id }, orderBy: { id: 'desc' }});
        if (last) {
            await prisma.expense.delete({ where: { id: last.id }});
            ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, `🗑️ <b>נמחק:</b> <s>${last.item}</s> (${last.amount}₪)`, { parse_mode: 'HTML' });
        } else {
            ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, 'אין מה למחוק.');
        }
        if (user.conversation) await prisma.conversationState.delete({ where: { userId: user.id } }).catch(() => {});
        break;

      case 'delete_specific_expense':
         if (analysis.search_term) {
             const items = await prisma.expense.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 50 });
             const cleanSearch = normalizeText(analysis.search_term);
             const matches = items.filter(e => normalizeText(e.item).includes(cleanSearch));

             if (matches.length > 0) {
                 if (analysis.delete_all) {
                     await prisma.expense.deleteMany({ where: { id: { in: matches.map(m => m.id) } } });
                     ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, `🗑️ נמחקו ${matches.length} פריטים תואמים.`);
                 } else {
                     const toDel = matches[0];
                     await prisma.expense.delete({ where: { id: toDel.id } });
                     ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, `🗑️ <b>נמחק:</b> <s>${toDel.item}</s>`, { parse_mode: 'HTML' });
                 }
             } else {
                 ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, 'לא נמצא.');
             }
         }
         if (user.conversation) await prisma.conversationState.delete({ where: { userId: user.id } }).catch(() => {});
         break;

      case 'reset_data':
         await prisma.expense.deleteMany({ where: { userId: user.id } });
         if (user.conversation) await prisma.conversationState.delete({ where: { userId: user.id } }).catch(() => {});
         ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, '🧹 הכל נמחק.');
         break;

      default:
        ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, 'לא הבנתי.');
    }
  } catch (error) {
    console.error(error);
    ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, 'שגיאה כללית.');
  }
});

export const initTelegramBot = async () => {
  if (!process.env.TELEGRAM_BOT_TOKEN) { console.error('❌ Missing Token'); return; }
  try {
    await bot.launch();
    console.log('🤖 Telegram Bot Started Successfully!');
    const stopBot = (signal: string) => bot.stop(signal);
    process.once('SIGINT', () => stopBot('SIGINT'));
    process.once('SIGTERM', () => stopBot('SIGTERM'));
  } catch (error) {
    console.error('❌ Failed to launch:', error);
  }
};