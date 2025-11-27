import { handlePrompt } from '../../src/controllers/expense.controller';
import { analyzeText } from '../../src/services/openai.service';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

// 1. Mock dependencies
jest.mock('../../src/services/openai.service');
jest.mock('@prisma/client', () => {
  const mPrisma = {
    user: { findUnique: jest.fn(), create: jest.fn() },
    expense: { create: jest.fn(), findMany: jest.fn() },
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

describe('Unit Test: Expense Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    req = { body: {} };
    res = { status: statusMock, json: jsonMock } as unknown as Response;
  });

  it('should return 400 if text or phoneNumber is missing', async () => {
    req.body = { text: 'Only text here' }; 
    await handlePrompt(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(400);
  });

  it('should create an expense when AI returns add_expense', async () => {
    req.body = { text: 'Pizza 50', phoneNumber: '123' };
    
    const prisma = new PrismaClient();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: 1 });
    
    // Mock AI response
    (analyzeText as jest.Mock).mockResolvedValue({ 
        action: 'add_expense', 
        item: 'Pizza', 
        amount: 50,
        category: 'Food'
    });

    await handlePrompt(req as Request, res as Response);

    expect(analyzeText).toHaveBeenCalledWith('Pizza 50');
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        action: 'add_expense'
    }));
  });
});