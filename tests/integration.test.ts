import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Integration Tests: Expense Tracker', () => {
  
  beforeAll(async () => {
    await prisma.$connect();
    // מחיקה נקייה של טבלאות (סדר הפוך בגלל קשרי גומלין)
    await prisma.expense.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST /prompt - should create a new expense', async () => {
    const response = await request(app)
      .post('/prompt')
      .send({
        text: "Bought coffee for 15",
        phoneNumber: "test-user-finance"
      });

    // 1. בדיקת תגובת ה-API
    expect(response.status).toBe(200);
    expect(response.body.action).toBe('add_expense');
    expect(response.body.result.amount).toBe(15);
    expect(response.body.result.item).toMatch(/coffee/i);

    // 2. בדיקה שהנתונים נשמרו ב-DB
    const user = await prisma.user.findUnique({ where: { phoneNumber: "test-user-finance" } });
    expect(user).toBeTruthy();

    const expenses = await prisma.expense.findMany({ where: { userId: user!.id } });
    expect(expenses.length).toBe(1);
    expect(expenses[0].amount).toBe(15);
  });

  it('POST /prompt - should group expenses in a report', async () => {
    // נבקש דוח עבור אותו משתמש
    const response = await request(app)
      .post('/prompt')
      .send({
        text: "Show me expenses",
        phoneNumber: "test-user-finance"
      });

    expect(response.body.action).toBe('list_expenses');
    // בדיקה שיש היררכיה (שנה קיימת)
    const currentYear = new Date().getFullYear().toString();
    expect(response.body.result.data).toHaveProperty(currentYear);
  });
});