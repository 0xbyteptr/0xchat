# CatboyChat - Server/Guild System & Token Storage Update

## Overview
Added a complete server/guild system with invites, along with enhanced JWT token storage. Users can now create and manage multiple servers, invite others, and join servers with invite codes.

## New Features

### 1. **Server/Guild System**
- Create custom servers with names and descriptions
- Each server has default channels (general, introductions, cute-stuff)
- Server owners and members with access control
- Server icons and branding support

### 2. **Invite System**
- Server owners can create unlimited invite links
- Invite links track usage and can be limited by max uses
- Expiration support for invites
- One-click join with invite codes

### 3. **Enhanced Token Storage**
- JWT tokens automatically saved to localStorage
- Tokens persisted across page refreshes
- Automatic token restoration on app load
- Secure token clearing on logout

## Files Created

### Backend Files
1. **lib/servers.ts** - `useServers` hook for server management
   - `createServer()` - Create new server
   - `listServers()` - Get user's servers
   - `getServer()` - Get server details
   - `createInvite()` - Generate invite link
   - `joinWithInvite()` - Join server with code

2. **app/api/servers/route.ts** - Server API endpoints
   - `POST /api/servers` - Main endpoint for all server actions
   - Actions: create, list, get, createInvite, joinWithInvite
   - Full JWT authentication on all endpoints
   - Permission checks (ownership, membership)

### Frontend Components
1. **components/ServerList.tsx** - Server selector sidebar
   - Vertical server list on left
   - Color-coded active selection
   - "+" button to create/join servers
   - Server icons with names

2. **components/CreateServerModal.tsx** - Server creation & join modal
   - Two modes: Create server & Join with invite
   - Form validation
   - Error handling and loading states
   - Toggle between modes

## Files Updated

### Type System
**lib/types.ts** - New interfaces added:
```typescript
interface Server {
  id: string;
  name: string;
  ownerId: string;
  description?: string;
  icon?: string;
  createdAt: string;
  members: string[];
  channels: Channel[];
  invites: Invite[];
}

interface Invite {
  id: string;
  serverId: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  maxUses?: number;
  uses: number;
  active: boolean;
}
```

### Database Layer
**lib/db.ts** - Enhanced with:
- Server CRUD operations (createServer, getServer, updateServer)
- User server listing (getUserServers)
- Invite management (createInvite, getInvite, useInvite)
- Server storage in `data/servers.json`
- Supports server members and channels

### Main Page
**app/page.tsx** - Complete redesign:
- Server list sidebar integration
- Server selection and switching
- Per-server channel management
- Modal for creating/joining servers
- Token restoration on mount
- Server-specific message loading

### Token Storage
**lib/hooks.ts** - `useAuth` hook improvements:
- `saveToken()` - Stores JWT to localStorage
- `clearToken()` - Removes token on logout
- `loadToken()` - Restores token from localStorage on mount
- Automatic token inclusion in API calls

## API Endpoints

### POST /api/servers
All endpoints require JWT authentication in Authorization header.

#### Create Server
```json
{
  "action": "create",
  "name": "My Server",
  "description": "Optional description"
}
```
Returns: `{ success: true, server: Server }`

#### List User's Servers
```json
{
  "action": "list"
}
```
Returns: `{ success: true, servers: Server[] }`

#### Get Server Details
```json
{
  "action": "get",
  "serverId": "server-id"
}
```
Returns: `{ success: true, server: Server }`

#### Create Invite
```json
{
  "action": "createInvite",
  "serverId": "server-id"
}
```
Returns: `{ success: true, invite: Invite }`

#### Join with Invite
```json
{
  "action": "joinWithInvite",
  "inviteId": "invite-id"
}
```
Returns: `{ success: true, server: Server }`

## Database Schema

### servers.json
```json
{
  "server-id": {
    "id": "server-id",
    "name": "Server Name",
    "ownerId": "user-id",
    "description": "Description",
    "icon": "🚀",
    "createdAt": "2024-12-10T...",
    "members": ["user-id-1", "user-id-2"],
    "channels": [
      {
        "id": "general",
        "name": "general",
        "messages": []
      }
    ],
    "invites": [
      {
        "id": "invite-code",
        "serverId": "server-id",
        "createdBy": "user-id",
        "createdAt": "2024-12-10T...",
        "maxUses": 0,
        "uses": 0,
        "active": true
      }
    ]
  }
}
```

## User Flow

### Creating a Server
1. User clicks "+" button in server list
2. Modal opens to create server form
3. Enter server name and description
4. Click "Create Server"
5. Server created, user automatically added as owner
6. Redirected to new server

### Joining a Server
1. User clicks "+" button in server list
2. Modal opens, switch to "Join with Invite" tab
3. Paste invite code
4. Click "Join Server"
5. Validated and added to server

### Sending Messages
1. Messages tagged with `server-id-channel-id`
2. API verifies JWT token
3. Message stored per server/channel
4. Auto-scrolls to latest message

## Token Lifecycle

### On Login/Register
1. Server generates JWT token with user payload
2. Token returned in response
3. Client calls `saveToken()` to store in localStorage
4. Token includes expiration (7 days default)

### On Page Load
1. Component mounts
2. `loadToken()` called in useEffect
3. Retrieves token from localStorage if exists
4. Token state updates, triggering server/message loads

### On Logout
1. User clicks logout button
2. `clearToken()` removes from localStorage
3. Clears token state
4. Redirects to login page

### On API Call
1. `useMessages` and `useServers` receive token
2. Add to Authorization header: `Bearer ${token}`
3. Server verifies token signature
4. Returns 401 if invalid/expired

## Security Features

✅ JWT token-based authentication
✅ Password hashing with bcryptjs (10 salt rounds)
✅ Server ownership verification
✅ Membership validation on all operations
✅ Secure token storage in localStorage
✅ Token expiration (7 days)
✅ Authorization headers on all API calls

## Next Steps (Optional)

- [ ] Real-time socket support for invites
- [ ] Invite expiration enforcement
- [ ] Server roles and permissions
- [ ] Message history pagination
- [ ] User profiles and avatars
- [ ] Typing indicators
- [ ] Read receipts
- [ ] File uploads

## Testing Checklist

- [ ] Create server successfully
- [ ] List user's servers
- [ ] Select different server
- [ ] Channels change per server
- [ ] Create invite link
- [ ] Join server with invite
- [ ] Messages isolated per server
- [ ] Token persists on refresh
- [ ] Logout clears token
- [ ] Invalid token rejected (401)

