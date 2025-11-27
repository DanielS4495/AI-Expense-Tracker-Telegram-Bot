import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { analyzeText } from '../services/openai.service';

const prisma = new PrismaClient();

// פונקציית עזר לסידור הנתונים
function groupExpenses(expenses: any[]) {
  const grouped: any = {};

  expenses.forEach((expense) => {
    const date = new Date(expense.createdAt);
    const year = date.getFullYear();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const day = date.getDate();

    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][month]) grouped[year][month] = {};
    if (!grouped[year][month][day]) grouped[year][month][day] = [];

    grouped[year][month][day].push({
      item: expense.item,
      amount: expense.amount,
      category: expense.category,
      time: date.toLocaleTimeString()
    });
  });

  return grouped;
}

export const handlePrompt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, phoneNumber } = req.body;

    if (!text || !phoneNumber) {
      res.status(400).json({ error: 'Missing info' });
      return;
    }

    let user = await prisma.user.findUnique({ where: { phoneNumber } });
    if (!user) {
      user = await prisma.user.create({ data: { phoneNumber } });
    }

    const analysis = await analyzeText(text);
    console.log('Analysis:', JSON.stringify(analysis, null, 2));

    let result: any = null;

    switch (analysis.action) {
     case 'add_expense':
        if (analysis.expenses && analysis.expenses.length > 0) {
          const createdExpenses = [];
          
          for (const exp of analysis.expenses) {
            // המרת התאריך מה-AI לאובייקט Date אמיתי
            // אם ה-AI לא החזיר תאריך, נשתמש בעכשיו
            const expenseDate = exp.date ? new Date(exp.date) : new Date();

            const newExpense = await prisma.expense.create({
              data: {
                userId: user.id,
                item: exp.item,
                amount: exp.amount,
                category: exp.category || 'General',
                location: exp.location || null,  // שמירת המיקום
                expenseDate: expenseDate         // שמירת הזמן האמיתי של הקניה
              }
            });
            createdExpenses.push(newExpense);
          }
          result = { saved_items: createdExpenses.length, items: createdExpenses };
        }
        break;

      case 'list_expenses':
        // לוגיקת דוח חכם עם יום חיוב
        const today = new Date();
        const billingDay = user.billingDay || 1;
        let startMonth = today.getMonth();
        if (today.getDate() < billingDay) startMonth--; 
        
        const startDate = new Date(today.getFullYear(), startMonth, billingDay);

        const rawExpenses = await prisma.expense.findMany({
          where: { userId: user.id, createdAt: { gte: startDate } },
          orderBy: { createdAt: 'desc' }
        });

        result = {
            cycle_start: startDate.toDateString(),
            total: rawExpenses.reduce((sum, e) => sum + e.amount, 0),
            data: groupExpenses(rawExpenses) // שימוש בפונקציה!
        };
        break;
        
      case 'update_expense':
        if (analysis.search_term) {
             const expense = await prisma.expense.findFirst({
                where: { userId: user.id, item: { contains: analysis.search_term } },
                orderBy: { createdAt: 'desc' }
             });
             if (expense) {
                 const updateData: any = {};
                 if (analysis.new_amount) updateData.amount = analysis.new_amount;
                 if (analysis.new_item) updateData.item = analysis.new_item;
                 result = await prisma.expense.update({ where: { id: expense.id }, data: updateData });
             } else {
                 result = { message: "Item not found to update" };
             }
        }
        break;

      case 'delete_last_expense':
          const last = await prisma.expense.findFirst({ where: { userId: user.id }, orderBy: { id: 'desc' }});
          if (last) {
              await prisma.expense.delete({ where: { id: last.id }});
              result = { message: `Deleted last item: ${last.item}` };
          }
          break;

      case 'delete_specific_expense':
          if (analysis.search_term) {
              const toDelete = await prisma.expense.findFirst({
                  where: { userId: user.id, item: { contains: analysis.search_term } },
                  orderBy: { createdAt: 'desc' }
              });
              if (toDelete) {
                  await prisma.expense.delete({ where: { id: toDelete.id }});
                  result = { message: `Deleted item: ${toDelete.item}` };
              }
          }
          break;

    //   case 'set_billing_day':
    //     if (analysis.day) {
    //         await prisma.user.update({
    //             where: { id: user.id },
    //             data: { billingDay: analysis.day }
    //         });
    //         result = { message: `Billing day set to ${analysis.day}` };
    //     }
    //     break;
    }

    res.json({ action: analysis.action, result });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber } = req.query;
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      res.status(400).json({ error: 'Missing phoneNumber' });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      include: { expenses: { orderBy: { createdAt: 'desc' } } }
    });
    res.json(user ? user.expenses : []);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};