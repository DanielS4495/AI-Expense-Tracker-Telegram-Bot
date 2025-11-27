import express from 'express';
import { handlePrompt, getExpenses } from './controllers/expense.controller';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Main AI Route
app.post('/prompt', handlePrompt);

// Direct Data Access Route
app.get('/expenses', getExpenses);

export default app;