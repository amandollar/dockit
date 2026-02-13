# DOCIT

**Upload it. Understand it. Act on it.**

DOCIT is an automated document management system with AI-powered summarization, workspace collaboration, and activity analytics.

## Features

- **Authentication** — Google OAuth and JWT (access + refresh), with 401 retry
- **Workspaces** — Create workspaces, invite members, manage roles
- **Documents** — Upload PDF, Word, Excel, text, CSV, and images; list, download, delete
- **AI** — Per-document summarize & ask; one-off file summarization (Vercel AI SDK + Gemini)
- **Workspace chat** — Real-time WebSocket chat per workspace
- **Analytics** — Activity streak and last 365 days grid (LeetCode-style)
- **Dark mode** — System-aware theme toggle on landing and dashboard

## Tech Stack

| Layer    | Stack |
| -------- | ----- |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Framer Motion |
| Backend  | Express, TypeScript |
| Database | MongoDB (Mongoose) |
| Storage  | Backblaze B2 (documents), Cloudinary (profile avatars) |
| AI       | Vercel AI SDK, Google Gemini |

## Project structure

```
dockit/
├── frontend/          # Next.js app
│   ├── app/           # Routes (dashboard, auth, landing)
│   ├── components/   # UI, dashboard, landing
│   └── lib/           # API client, auth context
├── backend/           # Express API
│   ├── src/
│   │   ├── config/   # env, multer, B2, etc.
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/ # auth, document, workspace, file-storage, ai, activity
│   │   └── middleware/
│   └── .env.example
└── README.md
```

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Google Cloud project (OAuth + optional Gemini)
- Backblaze B2 bucket (documents)
- Cloudinary account (avatars)

### Backend

1. Go to `backend/` and copy env:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your values:
   - `MONGODB_URI` — MongoDB connection string
   - `JWT_SECRET`, `JWT_REFRESH_SECRET` — Strong random strings
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` — OAuth (redirect e.g. `http://localhost:3000/auth/callback`)
   - `FRONTEND_URL` — e.g. `http://localhost:3000`
   - `GEMINI_API_KEY` — From [Google AI Studio](https://aistudio.google.com/apikey)
   - `B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME` — Backblaze B2
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — Cloudinary
   - `CORS_ORIGIN` — e.g. `http://localhost:3000`

3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

   API runs at `http://localhost:5000` by default. Health: `GET /health`.

### Frontend

1. Go to `frontend/` and create `.env.local` if you need to point at another API:

   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

   App runs at `http://localhost:3000`.

### First run

1. Open `http://localhost:3000`, sign in with Google.
2. Create a workspace from the dashboard, then open it to upload documents and use AI summarize/ask.

## API overview

- `POST /api/auth/google` — Start Google OAuth
- `GET /api/auth/callback` — OAuth callback (redirect)
- `POST /api/auth/refresh` — Refresh access token
- `GET/POST /api/workspaces` — List, create workspaces
- `GET/PATCH/DELETE /api/workspaces/:id` — Workspace CRUD, members
- `GET/POST /api/documents/...` — Upload, list, download, delete; summarize, ask
- `POST /api/documents/summarize-file` — One-off file summary (no workspace)
- `GET /api/analytics/me` — Streak, activity grid, totals

## License

ISC.
