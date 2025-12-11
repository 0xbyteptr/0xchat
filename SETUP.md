# CatboyChat - Quick Start Guide

## Installation

```bash
# Install dependencies
npm install

# Initialize the database with demo users
npm run setup

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Credentials

```
Username: demo
Password: password
```

## Project Features

✅ User authentication with bcrypt password hashing
✅ Multiple channels (general, introductions, cute-stuff)
✅ Discord-like UI with Tailwind CSS
✅ JSON database for development (expandable to MongoDB, PostgreSQL, etc.)
✅ RESTful API endpoints
✅ Real-time message updates
✅ User avatars

## Key Files

- `app/page.tsx` - Main chat UI
- `app/api/auth/route.ts` - Authentication endpoint
- `app/api/messages/route.ts` - Messages endpoint
- `lib/db.ts` - Database abstraction layer
- `lib/crypto.ts` - Password hashing utilities
- `data/users.json` - User database (development)
- `data/messages.json` - Messages database (development)

## API Endpoints

See [README.md](./README.md) for complete API documentation.

### Quick Reference

- `POST /api/auth` - Register/Login
- `GET /api/messages?channel=general` - Get messages
- `POST /api/messages` - Send message

## Environment Variables

See `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
DATABASE_TYPE=json
```

For production, change `DATABASE_TYPE` to `mongodb`, `postgres`, etc. and provide `DATABASE_URL`.

## Troubleshooting

### "Cannot find module" errors

Run: `npm install`

### Database initialization failed

Run: `npm run setup`

### Dev server won't start

Kill any existing node processes and try again:
```bash
npm run dev
```

## Next Steps

1. Create an account or use demo credentials
2. Join a channel and start chatting
3. Check the README.md for API documentation
4. Customize the app with your own channels and features
