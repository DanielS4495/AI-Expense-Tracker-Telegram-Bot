import app from './app';
import dotenv from 'dotenv';
import { initTelegramBot } from './services/telegram.service';

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('🔄 Calling initTelegramBot...');
  initTelegramBot();
});