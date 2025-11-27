import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export interface ExpenseItem {
  item: string;
  amount: number;
  category: string;
  location?: string;
  date?: string;
}

export interface ExpenseAnalysis {
  action: 'add_expense' | 'list_expenses' | 'delete_last_expense' | 'delete_specific_expense' | 'update_expense' | 'update_last_expense' | 'reset_data' | 'ask_for_info' | 'unknown'; 
  
  expenses?: ExpenseItem[]; 
  search_term?: string; 
  new_amount?: number;  
  new_item?: string;    
  new_date?: string;
  new_location?: string; // שדה לעדכון מיקום
  
  day?: number;
  delete_all?: boolean;
  question?: string;
  partial_data?: any;
}

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY, 
  baseURL: 'https://api.groq.com/openai/v1',
});

function cleanJsonOutput(content: string): string {
  let cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    return cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

export const analyzeText = async (text: string, previousContext: any = null): Promise<ExpenseAnalysis> => {
  const now = new Date().toISOString(); 
  
  let contextPrompt = "";
  if (previousContext) {
      contextPrompt = `
      PREVIOUS CONTEXT (Active Session): ${JSON.stringify(previousContext)}.
      INSTRUCTION: Check if user input is a reply. YES->Merge. NO->Ignore.
      `;
  }

  try {
    console.log('📡 Sending to AI...', previousContext ? '(With Context)' : '');
    
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: "json_object" },
      messages: [
        {
          role: 'system',
          content: `
            You are a financial assistant in Hebrew. Current Date (ISO): ${now}.
            Output JSON only. NO markdown.

            ${contextPrompt}

            *** RULES ***:
            1. **Add Expense**: Needs ITEM + Expense. Future date blocked by system.
            2. **Updates**: 
               - Can update: Amount, Name, Date, Location.
               - "Bought at Zara" / "Change store to Gong" -> new_location: "Zara/Gong".
               - **DATE CALCULATION**: Calculate specific ISO string based on "today", "yesterday", "tomorrow", and "שלשום" (day before yesterday).
            
            *** DISTINCTION ***:
            - "ב-5" (Date context) -> new_date (TIME).
            - "ב-5" (Expense context) -> new_amount (Expense).

            Actions: "add_expense", "list_expenses", "delete_last_expense", "delete_specific_expense", "update_expense", "update_last_expense", "reset_data", "ask_for_info".

            Structure for 'update_expense' / 'update_last_expense':
            { 
              "action": "update_...", 
              "search_term": "item name",
              "new_amount": number, 
              "new_item": string,
              "new_date": "ISO string",
              "new_location": "string"
            }

            Example (Location Update): "תשנה את הג'ינס לקניתי בגונג" -> 
            { "action": "update_expense", "search_term": "ג'ינס", "new_location": "גונג" }
          `
        },
        { role: 'user', content: text }
      ]
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content');
    
    const cleaned = cleanJsonOutput(content);
    console.log("AI Response:", cleaned);
    return JSON.parse(cleaned) as ExpenseAnalysis;

  } catch (error) {
    console.error('AI Error:', error);
    return { action: 'unknown' };
  }
};