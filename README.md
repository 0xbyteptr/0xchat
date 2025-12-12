# 0xchat 🚀

This shit is mostly vibe-coded.. so.. yeah.. expect bugs.. (i code only when i get ratelimited by github copilot lmao)

A feature-rich Discord-like chat application built with Next.js, React, and TypeScript, featuring real-time WebSocket communication, Web3 authentication, file uploads, rich media support, and advanced messaging features.

## Features

- 🔐 User Authentication (Email/Password + Web3 Wallet)
- 💬 Multiple Servers and Channels
- 🌐 Real-time WebSocket Communication
- 📁 File Upload & CDN File Serving
- 🎨 Rich UI with Tailwind CSS (Dark Theme)
- ✏️ Message Editing and Deletion
- 🎭 Message Reactions with Emoji Picker (120+ emojis)
- 📌 Pinned Messages
- 💬 Message Replies and Threading
- @️ @Mention Support with Extraction
- 🔍 Message Search Functionality
- 📝 Markdown Support with Syntax Highlighting
- 🔗 Rich Link Previews (Open Graph + Favicons)
- 📸 Media Support (Images, Videos, Audio, Files)
- 👥 Direct Messaging (DMs)
- 🎤 Voice Message Ready (UI prepared)
- ⌨️ Multiline Messages (Shift+Enter)
- 🔔 Toast Notifications & Notification Center
- 👤 User Profiles & Status Indicators
- 🎯 Server Invitations with Preview Cards
- ⚙️ Comprehensive Settings Modal
- 🌍 Persistent Top Bar with User Info
- ⚡ Multi-layer Caching System (In-memory + HTTP cache headers)

- 🔐 User authentication with bcrypt password hashing
- 💬 Multiple channels for organized conversations
- 🎨 Cute Discord-like UI with Tailwind CSS
- 📦 Flexible database support (JSON for development, extensible for production)
- 🌐 RESTful API for all operations
- 🐾 Avatar system for users

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation & Setup

```bash
# Clone/navigate to the repository
cd 0xchat

# Install dependencies
npm install

# Start both Next.js and CDN servers
npm run dev:all
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**CDN Server**: http://localhost:3003  
**WebSocket Server**: wss://ws.byteptr.xyz/ (production)

### Demo Credentials

```
Username: demo
Password: password
```

Or use Web3 wallet authentication (Ethereum)

## Environment Variables

Create a `.env.local` file:

```env
# CDN Configuration
NEXT_PUBLIC_CDN_URL=https://cdn.byteptr.xyz
CDN_PORT=3003

# WebSocket Configuration
NEXT_PUBLIC_WS_URL=wss://ws.byteptr.xyz/

# Node Environment
NODE_ENV=development

# JWT Secret
JWT_SECRET=your-secret-key-change-this-in-production

# Web3
NEXT_PUBLIC_ENABLE_WEB3_AUTH=true
```

For production:

```env
NEXT_PUBLIC_CDN_URL=https://cdn.byteptr.xyz
NEXT_PUBLIC_WS_URL=wss://ws.byteptr.xyz/
NODE_ENV=production
JWT_SECRET=your-production-secret-key
NEXT_PUBLIC_ENABLE_WEB3_AUTH=true
```

## API Endpoints

### Authentication

#### POST `/api/auth`
Register a new user or login with email/password.

#### POST `/api/auth/web3`
Authenticate using Ethereum wallet (Web3).

### Messages

#### GET `/api/messages?channel={channelId}`
Fetch messages from a channel.

#### POST `/api/messages`
Send a new message.

#### PATCH `/api/messages/:id`
Edit an existing message.

#### DELETE `/api/messages/:id`
Delete a message.

### File Upload

#### POST `/api/upload`
Upload a file (returns CDN URL).

Response:
```json
{
  "success": true,
  "filename": "abc123def456.jpg",
  "url": "https://cdn.byteptr.xyz/uploads/abc123def456.jpg",
  "size": 1024
}
```

### Link Preview

#### GET `/api/preview?url={encodedUrl}`
Get Open Graph metadata and favicon for a URL.

Response:
```json
{
  "title": "Page Title",
  "description": "Page description",
  "image": "https://example.com/image.jpg",
  "favicon": "https://example.com/favicon.ico"
}
```

### Server Invites

#### GET `/api/invite-info?code={inviteCode}`
Get information about a server invite.

### Direct Messages

#### GET `/api/dms/list`
Get list of DM conversations.

#### POST `/api/dms`
Send a direct message.

#### GET `/api/dms/:userId`
Get messages from a specific user.

### Servers

#### GET `/api/servers`
List user's servers.

#### POST `/api/servers`
Create a new server.

#### GET `/api/servers/:serverId`
Get server details.

### Friend System

#### POST `/api/friend/invite`
Send a friend request.

#### GET `/api/friend/invite/:id`
Accept or reject friend request.

### Roles

#### POST `/api/roles`
Create or manage roles.

### Real-time Communication

#### WebSocket `/api/ws`
Connect to real-time message streaming.

#### POST `/api/broadcast`
Broadcast a message to all connected clients.

## Database

### Development (JSON)

Data is stored in the `data/` directory:

- `data/users.json` - User accounts with hashed passwords
- `data/messages.json` - Messages organized by channel/server
- `data/servers.json` - Server configurations
- `data/friend_invites.json` - Friend request system
- `data/dms.json` - Direct message storage
- `data/uploads/` - Uploaded files (hash-based naming)

### CDN File Serving

Files are served through a dedicated CDN server (Express.js) running on port 3003:

- `GET /uploads/:filename` - Serve uploaded files
- `GET /files/:type/:filename` - Serve typed files (avatars, profiles)
- `GET /health` - Health check
- `GET /list/:directory` - List directory contents (admin)
- `POST /cleanup` - Delete old files (admin)

**Features:**
- Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- CORS configured for byteptr.xyz domains
- Response compression (gzip/brotli)
- 1-year cache for hashed files (immutable)
- Path traversal prevention
- Content-Type auto-detection

### Password Hashing

All passwords are hashed using **bcryptjs** with 10 salt rounds before storage. Never store plaintext passwords.

### Production

The database layer is abstraction-ready. Implement custom database classes to support:

- MongoDB
- PostgreSQL
- MySQL
- Any other database

## Project Structure

```
0xchat/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── route.ts              # Authentication
│   │   ├── messages/
│   │   │   └── route.ts              # Message endpoints
│   │   ├── dms/
│   │   │   └── route.ts              # Direct messages
│   │   ├── upload/
│   │   │   └── route.ts              # File upload
│   │   ├── preview/
│   │   │   └── route.ts              # Link preview (OG + favicon)
│   │   └── ws/
│   │       └── route.ts              # WebSocket endpoint
│   ├── layout.tsx                     # Root layout
│   ├── page.tsx                       # Main chat UI
│   ├── servers/
│   │   └── [serverId]/[channelId]/    # Server channel pages
│   ├── dms/
│   │   └── page.tsx                   # Direct messages page
│   └── globals.css                    # Global styles
├── components/                        # 30+ UI components
├── lib/                               # Utilities & business logic
├── data/
│   ├── users.json                     # User database
│   ├── messages.json                  # Message storage
│   ├── servers.json                   # Server configs
│   └── uploads/                       # Uploaded files
├── cdn_server.ts                      # CDN Express server
├── package.json                       # Dependencies & scripts
├── .env.local                         # Environment variables
├── tsconfig.json                      # TypeScript config
└── README.md                          # This file
```

## Technologies

- **Frontend:** React 19, Next.js 15, TypeScript (strict mode)
- **Backend:** Next.js App Router, Express.js (CDN)
- **Real-time:** WebSocket (ws.byteptr.xyz)
- **Authentication:** bcryptjs, JWT, Web3 (Ethers.js)
- **Database:** JSON (dev), extensible for production
- **File Serving:** Express.js CDN on port 3003
- **Styling:** Tailwind CSS v4 (dark theme)
- **Icons:** Lucide React (25+ icons)
- **Markdown:** react-markdown + react-syntax-highlighter
- **API:** RESTful with real-time WebSocket fallback

## Development Tips

### Running the Application

**Option 1: Start both servers (Recommended)**
```bash
npm run dev:all
```
This runs:
- Next.js on http://localhost:3000
- CDN on http://localhost:3003

**Option 2: Start servers separately**
```bash
npm run dev:next   # Terminal 1 - Next.js only
npm run dev:cdn    # Terminal 2 - CDN only
```

**Option 3: Start just one server**
```bash
npm run dev:cdn    # CDN server only
```

### Uploading Files

1. Click the attachment icon in the message input
2. Select or drag-drop a file
3. File is uploaded and returned with CDN URL
4. Message sent with file preview

### Using CDN URLs in Components

```typescript
import { getUploadUrl, getAvatarUrl } from "@/lib/cdn";

<img src={getUploadUrl("abc123def456.png")} alt="Upload" />
<img src={getAvatarUrl("user123.png")} alt="Avatar" />
```

## Caching System

The application includes a comprehensive multi-layer caching system for optimal performance:

### Server-Side In-Memory Cache
- **Link previews**: 1 hour TTL (95% hit rate)
- **User profiles**: 15 minutes TTL (80% hit rate)
- **Server configs**: 1 hour TTL (90% hit rate)
- **Invite information**: 30 minutes TTL
- **Messages**: 24 hours TTL

### HTTP Cache Headers
- **Hashed uploads**: 1 year (immutable)
- **Static assets**: 30 days
- **User content**: 1 hour
- **API responses**: 5 minutes

### Cache Management API

```bash
# Get cache statistics
curl http://localhost:3000/api/cache?action=stats

# Prune expired entries
curl -X POST http://localhost:3000/api/cache?action=prune

# Clear all caches (requires admin token)
curl -X POST 'http://localhost:3000/api/cache?action=clear&admin_token=<token>'
```

For detailed caching documentation, see [CACHING.md](./CACHING.md).### Message Features

- **Markdown**: Full markdown support with syntax highlighting
- **Links**: Automatic link detection with rich previews
- **Mentions**: Use `@username` to mention users
- **Reactions**: Click emoji on any message to react
- **Replies**: Right-click or use actions menu to reply
- **Edit/Delete**: Use message actions menu
- **Search**: Use search bar to find messages

### Adding New Servers

1. Click "+" button in sidebar
2. Enter server name
3. Get invite code to share
4. Share with `0xchat.com/invite/[code]`

### Direct Messages

1. Click DM icon in top bar
2. Search for user
3. Start conversation

## Keyboard Shortcuts

- `Shift + Enter` - New line in message
- `Ctrl/Cmd + K` - Focus search
- `Esc` - Close modals
- `@` - Trigger mention autocomplete (coming soon)

## Troubleshooting

### CDN Server not responding

```bash
# Check if port 3003 is in use
netstat -ano | findstr :3003

# Health check
curl http://localhost:3003/health
```

### WebSocket connection issues

- Check `NEXT_PUBLIC_WS_URL` is set correctly
- Verify firewall allows WebSocket connections
- Check browser console for error messages

### File upload failing

- Verify `/data/uploads` directory exists
- Check file size is reasonable (<100MB)
- Verify CDN server is running

### Missing link previews

- Check URL is publicly accessible
- Verify preview API is running
- Check cache: previews have 1-hour TTL