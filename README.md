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

```bash
npx prisma migrate dev --name init
```

## 🏃 running the Application

### Development Mode

Starts the server with hot-reloading (nodemon):

```bash
npm run dev
```

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

