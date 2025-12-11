# CatboyChat 🐱

A cute Discord-like chat service built with Next.js, featuring user authentication with password hashing, multiple channels, and real-time messaging.

## Features

- 🔐 User authentication with bcrypt password hashing
- 💬 Multiple channels for organized conversations
- 🎨 Cute Discord-like UI with Tailwind CSS
- 📦 Flexible database support (JSON for development, extensible for production)
- 🌐 RESTful API for all operations
- 🐾 Avatar system for users

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
cd catboychat

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Demo Credentials

```
Username: demo
Password: password
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
DATABASE_TYPE=json
```

For production:

```env
NEXT_PUBLIC_API_URL=https://your-domain.com
NODE_ENV=production
DATABASE_TYPE=mongodb  # or postgres, etc.
DATABASE_URL=your-connection-string
```

## API Endpoints

### Authentication

#### POST `/api/auth`

Register a new user or login.

**Request:**

```json
{
  "action": "register",
  "username": "catboy123",
  "password": "securepassword"
}
```

Or for login:

```json
{
  "action": "login",
  "username": "demo",
  "password": "password"
}
```

**Response (Success):**

```json
{
  "success": true,
  "user": {
    "id": "catboy123",
    "username": "catboy123",
    "avatar": "😸"
  }
}
```

**Response (Error):**

```json
{
  "error": "Invalid username or password"
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad request (invalid input, username exists)
- `401` - Unauthorized (invalid credentials)
- `500` - Internal server error

---

### Messages

#### GET `/api/messages?channel=general`

Get all messages from a specific channel.

**Query Parameters:**
- `channel` (required) - Channel ID (e.g., "general", "introductions", "cute-stuff")

**Response:**

```json
{
  "messages": [
    {
      "id": "1",
      "author": {
        "id": "demo",
        "username": "demo",
        "avatar": "😸"
      },
      "content": "Meow! This is a test message",
      "timestamp": "2025-12-10T12:00:00Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad request (missing channel)
- `500` - Internal server error

---

#### POST `/api/messages`

Send a message to a channel.

**Request:**

```json
{
  "channel": "general",
  "message": {
    "id": "1234567890",
    "author": {
      "id": "demo",
      "username": "demo",
      "avatar": "😸"
    },
    "content": "Hello everyone! 🐾",
    "timestamp": "2025-12-10T12:00:00Z"
  }
}
```

**Response:**

```json
{
  "success": true
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad request (missing channel or message)
- `405` - Method not allowed
- `500` - Internal server error

---

## Database

### Development (JSON)

Data is stored in the `data/` directory:

- `data/users.json` - User accounts with hashed passwords
- `data/messages.json` - Messages organized by channel

### Password Hashing

All passwords are hashed using **bcryptjs** with 10 salt rounds before storage. Never store plaintext passwords.

### Production

The database layer is abstraction-ready. Implement custom database classes inheriting from the `Database` abstract class in `lib/db.ts` to support:

- MongoDB
- PostgreSQL
- MySQL
- Any other database

## Project Structure

```
catboychat/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── route.ts          # Authentication endpoint
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Main chat UI
│   └── globals.css                # Global styles
├── pages/
│   └── api/
│       └── messages.ts            # Messages endpoint
├── lib/
│   ├── db.ts                      # Database abstraction layer
│   └── crypto.ts                  # Password hashing utilities
├── data/
│   ├── users.json                 # User database (dev)
│   └── messages.json              # Messages database (dev)
├── .env.local                     # Environment variables
└── package.json                   # Dependencies
```

## Technologies

- **Frontend:** React, Next.js, Tailwind CSS
- **Backend:** Next.js App Router
- **Authentication:** bcryptjs
- **Database:** JSON (dev), extensible for production
- **Styling:** Tailwind CSS v4

## Development Tips

### Adding a New Channel

1. Create the channel in the frontend (`app/page.tsx`)
2. Add initial messages to `data/messages.json`

### Switching Database Backends

Update `.env.local`:

```env
DATABASE_TYPE=mongodb
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/catboychat
```

Then implement a MongoDB database class in `lib/db.ts`.

## License

MIT
