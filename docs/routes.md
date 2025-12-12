# Routes Reference

This file documents the important application routes in 0xChat: client pages, API endpoints, WebSocket endpoints, and CDN routes. It also includes links to the location of the server and handler code.

**Note:** Use the app/service code and route files as source of truth — tooling and route names can change. This document is a quick reference for development.

---

## Top-Level Site Pages (client side)
- `/` — Home / landing page: [app/page.tsx](app/page.tsx#L1)
- `/dms` — Direct messages index / chat: [app/dms/page.tsx](app/dms/page.tsx#L1)
- `/friends` — Friends UI: [app/friends/page.tsx](app/friends/page.tsx#L1)
- `/invite/[code]` — Invite landing page: [app/invite/[code]/page.tsx](app/invite/[code]/page.tsx#L1)
- `/servers` — Server list: [app/servers/page.tsx](app/servers/page.tsx#L1)
- `/servers/[serverId]/[channelId]` — Server chat view: [app/servers/[serverId]/[channelId]/page.tsx](app/servers/[serverId]/[channelId]/page.tsx#L1)

> These routes map to the UI (React components) under `app/*`, and are implemented using Next.js routing.

---

## API Routes (app/api)
A short reference of the major API endpoints, HTTP methods and locations:

### Authentication
- `POST /api/auth` — login / auth: [app/api/auth/route.ts](app/api/auth/route.ts#L1)
- `POST /api/auth/web3` — web3 login endpoint: [app/api/auth/web3/route.ts](app/api/auth/web3/route.ts#L1)

### Users & Profile
- `GET /api/profile` — fetch the current user's profile: [app/api/profile/route.ts](app/api/profile/route.ts#L1)
- `POST /api/profile` — update profile: [app/api/profile/route.ts](app/api/profile/route.ts#L1)

### Messages & DMs
- `GET /api/messages` — list messages: [app/api/messages/route.ts](app/api/messages/route.ts#L1)
- `POST /api/messages` — create a message: [app/api/messages/route.ts](app/api/messages/route.ts#L1)
- `PATCH /api/messages/:id` — edit a message (author-only). Request body: `{ "content": "updated text" }`(requires Authorization Bearer token): [app/api/messages/[id]/route.ts](app/api/messages/[id]/route.ts#L1)
- `DELETE /api/messages/:id` — delete a message (author-only). Requires Authorization Bearer token: [app/api/messages/[id]/route.ts](app/api/messages/[id]/route.ts#L1)
- `GET /api/dms` — list DMs and conversations: [app/api/dms/route.ts](app/api/dms/route.ts#L1)
- `POST /api/dms/:userId` — send a DM to user: [app/api/dms/route.ts](app/api/dms/route.ts#L1)

### Friends, Servers, Invites & Roles
- `POST /api/friend/invite` — create friend invite: [app/api/friend/invite/route.ts](app/api/friend/invite/route.ts#L1)
- `GET/POST /api/servers` — server listing & creation: [app/api/servers/route.ts](app/api/servers/route.ts#L1)
- `POST /api/servers/:serverId` — update or manage server: [app/api/servers/route.ts](app/api/servers/route.ts#L1)
- `GET/POST /api/servers/:serverId/members` — manage members: [app/api/servers/route.ts](app/api/servers/route.ts#L1)
- `GET /api/roles` — list/modify roles: [app/api/roles/route.ts](app/api/roles/route.ts#L1)

### Preview, CDN & Uploads
- `GET /api/preview?url=<url>` — fetch link preview (uses caching): [app/api/preview/route.ts](app/api/preview/route.ts#L1)
- `POST /api/upload` — uploads (relies on CDN): [app/api/upload/route.ts](app/api/upload/route.ts#L1)

### Websockets
- `GET /api/ws` — web socket handshake / fallback route if proxied; actual websocket server runs in `ws-server.ts` but there is a route that can be used for tests or a websocket handshake: [app/api/ws/route.ts](app/api/ws/route.ts#L1) and [lib/ws-server.ts](lib/ws-server.ts#L1)

WebSocket Events (broadcast from server):
- `message` — a new message was posted. Payload: `{ type: "message", channel: "<serverId>-<channelId>", message: Message }`
- `message_edit` — an existing message was edited. Payload: `{ type: "message_edit", channel: "<serverId>-<channelId>", message: Message }`
- `message_delete` — a message was deleted. Payload: `{ type: "message_delete", channel: "<serverId>-<channelId>", messageId: string }`

Clients should listen for these event types and update the UI accordingly (e.g., editing inline message content or removing a message). Edits include `editedAt` and `isEdited` fields on the message when applicable.

### Cache Management
- `GET /api/cache?action=stats` — return cache stats: [app/api/cache/route.ts](app/api/cache/route.ts#L1)
- `POST /api/cache?action=prune` — prune expired cache entries: [app/api/cache/route.ts](app/api/cache/route.ts#L1)
- `POST /api/cache?action=clear&admin_token=<token>` — clear caches (admin-only): [app/api/cache/route.ts](app/api/cache/route.ts#L1)

---

## CDN Endpoints (cdn_server)
If running a separate CDN server (local dev or production), these routes are implemented in the `cdn_server` Express server.

- `GET /health` — CDN health check: [cdn_server.ts](cdn_server.ts#L1) (or `cdn_server.js`)
- `GET /uploads/:filename` — uploaded file endpoint (uses immutible cache and ETag): [cdn_server.ts](cdn_server.ts#L1)
- `GET /files/:type/:filename` — serve arbitrary files from data directory (avatars, profile assets) with validation: [cdn_server.ts](cdn_server.ts#L1)
- `GET /list/:directory` — list directory (admin/debug): [cdn_server.ts](cdn_server.ts#L1)
- `POST /cleanup` — delete older files: [cdn_server.ts](cdn_server.ts#L1)

**CDN URL configuration:**
- The app uses `NEXT_PUBLIC_CDN_URL` (environment variable) and `lib/cdn.ts` maps `/data/uploads/*` to `/uploads/*` on the CDN. Example: `https://cdn.byteptr.xyz/uploads/abc123.png`.

---

## Client-facing WebSocket (optional)
- Websockets are handled by `lib/ws-server.ts`. Production should proxy `ws://` via `ws.byteptr.xyz`. If testing locally, the app uses the configured WebSocket server URL via `ws-server.ts` and `app/api/ws/route.ts`.

---

## Examples

### Send Message (server/channel)
POST /api/messages

Request body (JSON):
```json
{
  "serverId": "server123",
  "channelId": "general",
  "content": "Hello @alice!"
}
```

### List Uploads (CDN; admin only)
GET /list/uploads

### Create Invite
POST /api/friend/invite

Request body:
```json
{ "to": "0xUserAddressOrUsername" }
```

---

## Where to add new routes
- Add API endpoints in `app/api/*` as Next.js route handlers.
- Add UI pages in `app/*` and components under `components/*`.
- Add background or auxiliary servers under `lib/*` (e.g., `ws-server.ts`, `cdn_server.ts`).

---

## Notes & Best Practices
- Service endpoints that are public and immutable (CDN hashed files) should use strong Cache-Control: `public, max-age=31536000, immutable`.
- API endpoints should honor `Cache-Control` tailored to the data (see `lib/cache-headers.ts`).
- Keep API and page routing organized: group routes logically under `app/api/` and page routes under `app/`.
- When adding new endpoints, update tests and the `/docs/routes.md` file to keep the reference accurate.