<<<<<<< HEAD
# Habit & Routine Management Backend

This project is a Node.js + TypeScript backend designed to manage user habits through natural language input. It utilizes OpenAI (or a mock fallback) to interpret user intents and persists data in a local SQLite database using Prisma ORM.

## 📋 Features

- **Natural Language Processing**: Parses free-text inputs like "I want to drink water 3 times a day".
- **Smart Intent Detection**: Automatically identifies if the user wants to `CREATE`, `DELETE`, or `LIST` habits.
- **CRUD Operations**: Full management of habits linked to user phone numbers.
- **REST API**: Simple endpoints for integration with frontend or chat interfaces (e.g., WhatsApp).
- **Production Ready**: Structured with clear separation of concerns (Controllers, Services, Models).

## 🛠 Tech Stack

- **Runtime**: Node.js (LTS)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: SQLite
- **ORM**: Prisma
- **AI Integration**: OpenAI API
- **Testing**: Jest + Supertest

## 🚀 Setup & Installation

Follow these steps to run the project locally.

### 1. Prerequisites
- Node.js installed (v18 or higher recommended)
- npm or yarn

### 2. Clone and Install
```bash
git clone https://github.com/DanielS4495/project_fullstack.git
cd backend
npm install
````

### 3\. Environment Configuration

Create a `.env` file in the root directory based on the example below:

```env
PORT=3000
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="your_openai_api_key_here"
```

*Note: If you don't provide a valid OpenAI key, the system will automatically use a Mock Service for testing purposes.*

### 4\. Database Setup

Initialize the SQLite database and run migrations:
=======
# 🤖 AI Expense Tracker Telegram Bot

**מערכת חכמה לניהול הוצאות אישי בטלגרם, מבוססת בינה מלאכותית.**

הפרויקט הזה הוא בוט טלגרם שנכתב ב-**Node.js & TypeScript**. הוא מאפשר למשתמשים לנהל את המעקב הפיננסי שלהם באמצעות שיחה טבעית בעברית (NLP). המערכת משתמשת במודלי שפה מתקדמים (LLMs) כדי להבין הקשר, לחלץ נתונים, ולבצע פעולות מורכבות במסד נתונים.

---

## ✨ פיצ'רים מרכזיים

### 🧠 בינה מלאכותית והבנת שפה (NLP)
* **הוספה טבעית:** "קניתי פיצה ב-50 וג'ינס בזארה ב-200" (המערכת תפריד לשתי הוצאות שונות ותזהה קטגוריות).
* **זיכרון שיחה (Context Awareness):** אם המשתמש כותב "קניתי חולצה" והבוט שואל "כמה עלה?", המשתמש יכול לענות "100" והבוט יבין לבד שזה המחיר של החולצה.
* **זיהוי זמנים חכם:** תמיכה בביטויים כמו "אתמול ב-5 בערב", "שלשום", "לפני שעה".

### 🛡️ אבטחה וניהול משתמשים
* **אימות דו-שלבי:** אימות משתמשים באמצעות מנגנון `Contact Request` של טלגרם למניעת התחזות.
* **הגנות לוגיות:** מניעת הזנת תאריכים עתידיים, ולידציה של סכומים ושמות.

### ⚙️ יכולות עריכה מתקדמות (CRUD)
* **עדכון חכם:** "תשנה את התאריך של הג'ינס לאתמול" (משנה רק תאריך, שומר על המחיר).
* **חיפוש גמיש (Fuzzy Search):** מוצא פריטים גם אם יש שגיאות כתיב קלות או הבדלים בגרשיים ("גינס" לעומת "ג'ינס").
* **מחיקה:** מחיקת פריט ספציפי ("תמחק את הפיצה") או מחיקה גורפת ("תמחק את כל ההוצאות על דלק").
* **דוחות:** הפקת דוח הוצאות מעוצב עם סיכום כספי.

---

## 🛠 Tech Stack (טכנולוגיות)

* **Runtime:** Node.js
* **Language:** TypeScript
* **Framework:** Telegraf.js (Telegram Bot API)
* **AI:** OpenAI SDK (connected to **Groq** running **Llama 3.3 70B**)
* **Database:** PostgreSQL (Production) / SQLite (Dev)
* **ORM:** Prisma
* **Hosting:** Render (App) + Neon (DB)

---

## 🚀 התקנה והרצה מקומית

### 1. שכפול הפרויקט
```bash
git clone https://github.com/DanielS4495/AI-Expense-Tracker-Telegram-Bot.git
cd backend
````

### 2\. התקנת תלויות

```bash
npm install
```

### 3\. הגדרת משתני סביבה (.env)

צור קובץ `.env` בתיקייה הראשית והגדר את המשתנים הבאים:

```env
# Database Connection (SQLite for local, Postgres for prod)
DATABASE_URL="file:./dev.db"

# Telegram Bot Token (from @BotFather)
TELEGRAM_BOT_TOKEN="your_telegram_token_here"

# AI Provider API Key (Groq)
GROQ_API_KEY="your_groq_api_key_here"

# Server Port
PORT=3000
```

### 4\. בניית בסיס הנתונים
>>>>>>> 0f13144783a7807b26ac62a13e639c6619162c69

```bash
npx prisma migrate dev --name init
```

<<<<<<< HEAD
## 🏃 running the Application

### Development Mode

Starts the server with hot-reloading (nodemon):
=======
### 5\. הרצת השרת (מצב פיתוח)
>>>>>>> 0f13144783a7807b26ac62a13e639c6619162c69

```bash
npm run dev
```

<<<<<<< HEAD
The server will start at: `http://localhost:3000`

### Production Build

Builds the TypeScript code and runs the compiled JavaScript:

```bash
npm run build
npm start
```

## 🧪 Testing

The project includes integration tests that run against a real SQLite database (cleaned up before each run).

Run the tests using:

```bash
npm test
```

## 🔌 API Endpoints

### 1\. Process User Input

**POST** `/prompt`

Analyzes natural language text and performs the requested action.

**Body:**

```json
{
  "text": "Remind me to exercise daily",
  "phoneNumber": "555-0199"
}
```

**Response:**

```json
{
  "action": "create",
  "result": {
    "id": 1,
    "habitName": "exercise",
    "frequencyType": "daily",
    "status": "active"
  }
}
```

### 2\. Get User Habits

**GET** `/habits?phoneNumber=555-0199`

Returns a list of all habits for a specific user.

## 📂 Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers (API logic)
├── models/         # Database models (Prisma)
├── services/       # Business logic (OpenAI service)
├── app.ts          # Express app setup
└── index.ts        # Server entry point
tests/
└── integration.test.ts # End-to-End tests
```

## 🔮 Future Improvements (Out of Scope)

  - WhatsApp/Twilio integration.
  - Cron jobs for actual reminders.
  - Advanced authentication.

=======
השרת ירוץ כעת, והבוט יתחיל להגיב בטלגרם\!

-----

## 💬 מדריך למשתמש (דוגמאות לשיחה)

הנה כמה דוגמאות למה שאפשר להגיד לבוט:

| פעולה | דוגמה לפקודה |
| :--- | :--- |
| **הוספת הוצאה** | "קניתי סושי ב-80" |
| **הוספה מרובה** | "דלק ב-200 וקניות בסופר ב-450" |
| **הוספה עם סיפור** | "הייתי אתמול בקניון וקניתי נעליים ב-300" |
| **הפקת דוח** | "תביא לי דוח" / "רשימה" |
| **תיקון מחיר** | "תשנה את הסושי ל-100" |
| **תיקון תאריך** | "תשנה את התאריך של הנעליים לאתמול ב-10" |
| **מחיקה** | "תמחק את הפיצה" |
| **מחיקה גורפת** | "תמחק את כל ההוצאות על מוניות" |
| **איפוס מלא** | "תאפס הכל" (מוחק את כל ההיסטוריה שלך) |

-----

## 📂 מבנה הפרויקט

```
src/
├── controllers/    # API Controllers (לשימוש עתידי באתר Web)
├── services/
│   ├── openai.service.ts    # המוח: ניתוח טקסט, פרומפטים, וניהול הקשר
│   └── telegram.service.ts  # הבוט: לוגיקת שיחה, אבטחה, ועיצוב הודעות
├── prisma/
│   └── schema.prisma        # הגדרת הטבלאות (User, Expense, ConversationState)
├── app.ts          # הגדרת שרת Express
└── index.ts        # נקודת הכניסה (Entry Point)
```

-----

## 🔮 תוכניות לעתיד (Roadmap)

  - [ ] בניית דשבורד React לצפייה בגרפים ופילוחים.
  - [ ] הוספת תמיכה בתזכורות (Cron Jobs) להוצאות קבועות.
  - [ ] יצוא נתונים לאקסל/CSV ישירות מהטלגרם.

-----


```
```
>>>>>>> 0f13144783a7807b26ac62a13e639c6619162c69
