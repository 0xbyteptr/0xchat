# Project Structure

## Architecture

CatboyChat is organized into clear, modular layers:

```
catboychat/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── auth/
│   │   │   └── route.ts         # Authentication endpoint
│   │   └── messages/
│   │       └── route.ts         # Messages endpoint
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Main page with state management
│   └── globals.css              # Global styles
│
├── components/                   # React Components
│   ├── LoginForm.tsx            # Login/Register UI
│   ├── Sidebar.tsx              # Channel sidebar
│   ├── ChatHeader.tsx           # Channel header
│   ├── MessagesList.tsx         # Messages display
│   ├── MessageInput.tsx         # Message input form
│   └── ChatLayout.tsx           # Main chat layout
│
├── lib/                         # Utilities & Business Logic
│   ├── db.ts                    # Database abstraction layer
│   ├── crypto.ts                # Password hashing
│   ├── types.ts                 # TypeScript type definitions
│   ├── constants.ts             # Constants (channels, avatars, messages)
│   ├── hooks.ts                 # Custom React hooks (useAuth)
│   └── messages.ts              # Message-related hooks (useMessages)
│
├── data/                        # Development database (JSON)
│   ├── users.json               # User accounts
│   └── messages.json            # Channel messages
│
├── scripts/
│   └── setup.js                 # Database initialization script
│
├── .env.local                   # Environment variables
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── next.config.ts               # Next.js config
├── README.md                    # API documentation
└── SETUP.md                     # Quick start guide
```

## Component Hierarchy

```
Home (page.tsx)
├── [Authentication State]
│   └── LoginForm
└── [Logged In State]
    └── ChatLayout
        ├── Sidebar
        │   ├── Channel List
        │   └── User Profile
        ├── ChatHeader
        ├── MessagesList
        │   └── Message Items
        └── MessageInput
```

## Data Flow

### Authentication Flow
1. User submits username/password in `LoginForm`
2. `page.tsx` calls `useAuth()` hook
3. Hook sends request to `/api/auth`
4. Auth route uses `getDatabase()` to verify credentials
5. User data returned and stored in state
6. UI switches to `ChatLayout`

### Messages Flow
1. On mount, `page.tsx` loads messages from all channels
2. Fetches from `/api/messages?channel=<name>`
3. Messages route queries database via `getDatabase()`
4. Data formatted and displayed in `MessagesList`
5. User types in `MessageInput`
6. Message sent to `/api/messages` on submit
7. Message added to local state and database
8. UI updates via `MessagesList`

## Key Design Patterns

### Separation of Concerns
- **Components**: Pure presentational, receive props
- **Hooks**: Business logic (auth, messages)
- **Database**: Data persistence and abstraction
- **API Routes**: Server-side logic

### Type Safety
- TypeScript interfaces in `lib/types.ts`
- Shared types across components and hooks
- Type-safe prop passing

### Reusability
- Custom hooks (`useAuth`, `useMessages`) can be used in other components
- Components are fully self-contained
- Constants centralized in `lib/constants.ts`

### Extensibility
- Database layer supports multiple backends
- Easy to add new channels
- New components can be added without modifying existing ones

## File Responsibilities

### Components
- **LoginForm.tsx**: Handles login/register UI only
- **Sidebar.tsx**: Channel list and user profile display
- **ChatHeader.tsx**: Selected channel information
- **MessagesList.tsx**: Message display
- **MessageInput.tsx**: Message input form
- **ChatLayout.tsx**: Composes all chat components

### Library Files
- **types.ts**: Type definitions (User, Message, Channel)
- **constants.ts**: Hard-coded values and enums
- **db.ts**: Database abstraction and implementation
- **crypto.ts**: Password hashing/verification
- **hooks.ts**: useAuth hook
- **messages.ts**: useMessages hook

### API Routes
- **api/auth/route.ts**: User registration and login
- **api/messages/route.ts**: Message fetching and posting

## Adding New Features

### Add a New Component
1. Create in `components/NewComponent.tsx`
2. Export in `components/index.ts` (optional)
3. Import and use in parent component

### Add a New Hook
1. Create in `lib/newHook.ts` or extend `lib/hooks.ts`
2. Use `useCallback` and `useState` for logic
3. Import in component and use

### Add a New API Endpoint
1. Create `app/api/feature/route.ts`
2. Implement GET/POST methods
3. Use `getDatabase()` for data access
4. Call from components via fetch

### Switch to Production Database
1. Update `.env.local`: `DATABASE_TYPE=mongodb`
2. Implement `MongoDBDatabase` class in `lib/db.ts`
3. The rest of the code remains unchanged!

## Development Workflow

```
Start Dev Server
    ↓
Load app/page.tsx
    ↓
Check isLoggedIn state
    ↓
Show LoginForm or ChatLayout
    ↓
User interaction
    ↓
Call API routes or update state
    ↓
Components re-render
    ↓
Database updated (if applicable)
```

## Testing Tips

### Test Authentication
- Use demo credentials: `demo` / `password`
- Create new account
- Check `data/users.json` for hashed password

### Test Messages
- Send message in a channel
- Check `data/messages.json` for message storage
- Reload page to verify persistence

### Test Database
- Modify `lib/constants.ts` to add channels
- Run `npm run setup` to reinitialize data
- Test different `DATABASE_TYPE` values in `.env.local`
