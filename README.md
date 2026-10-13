# Pulse

Verified-identity messaging for the iGaming industry. Every member passes an ID check (Didit) before they can use the app, and the name shown on Pulse comes only from that ID.

- **Frontend:** React + Vite, Tailwind v4, React Router (`frontend/`)
- **Backend:** Node.js + Express + Socket.IO, PostgreSQL via `pg` (`backend/`)
- **Services:** Stripe (Pro plan), Didit (KYC), Agora (calls), Google Calendar, SMTP email, GA4 (behind cookie consent)

Deployment to the VPS is covered step by step in [DEPLOY.md](DEPLOY.md).

---

## Running locally

Requires Node 20+ and PostgreSQL.

```bash
# 1. Backend
cd backend
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET at minimum
npm install
npm run db:migrate          # runs every file in src/db/migrations in order
npm run dev                 # http://localhost:3001

# 2. Frontend (second terminal)
cd frontend
cp .env.example .env        # VITE_STRIPE_PUBLISHABLE_KEY for the payment screens
npm install
npm run dev                 # http://localhost:5173, /api is proxied to the backend
```

Every optional service degrades gracefully when its keys are missing. Without SMTP, emails and one-time codes are printed to the backend console. Without Didit, the ID check is skipped and every account is marked verified, so never leave `DIDIT_API_KEY` and `DIDIT_WORKFLOW_ID` unset on a live server. Without Agora, calls say they are not configured.

---

## Configuration

All settings come from environment variables, never from code.

| Where | What |
|---|---|
| `backend/.env.example` | Every backend variable, with what it does and its default. Copy to `backend/.env`. |
| `backend/src/config/env.js` | Reads and validates the core variables. The app refuses to start without `DATABASE_URL`, `JWT_SECRET` and `JWT_REFRESH_SECRET`. |
| `frontend/.env.example` | The two build-time variables. Anything here ends up in the public bundle, so no secrets. |
| `frontend/src/config/site.js` | Public facts used across screens: the site URL and the support address. |

The legal pages (Terms, Privacy, Cookie and KYC policies) spell out their contact addresses in the published text and are edited there.

---

## Project layout

### Backend (`backend/src`)

A request flows **route → middleware → controller → service / query → database**.

| Folder | Holds |
|---|---|
| `index.js`, `server.js` | Startup, and the Express app: security headers, CORS, rate limits, route mounting, the global error handler. |
| `config/` | Env loading, the database pool, Stripe client, email transport and templates. |
| `routes/` | One file per area (`auth`, `users`, `conversations`, `payment`, `admin`, …). URL shape and validation only. |
| `middleware/` | Auth (`auth.js`, `adminAuth.js`), request validation, rate limiting, upload filters, `errorHandler.js`. |
| `controllers/` | Turn a request into a response. Errors go to `next(err)` so the global handler answers. |
| `services/` | Multi-step business rules that more than one controller needs: auth, KYC decisions, payments. |
| `db/queries/` | All SQL, grouped by table area. Controllers never write SQL inline. |
| `db/migrations/` | Numbered SQL files, run in order on every deploy. They must be safe to re-run; one-off data fixes are guarded by the `one_off_backfills` table. |
| `webhooks/` | Stripe and Didit callbacks (raw body, signature checked). |
| `socket/` | Socket.IO: live messages, typing, presence, call signalling. |
| `jobs/` | Background work, such as the unread-message email. |
| `utils/` | Small pure helpers shared by the backend (`plan.js` for Pro checks, `names.js` for ID-name rules). |

**API:** everything is under `/api`. Areas: `/auth`, `/users`, `/conversations` (with messages), `/contacts`, `/groups`, `/calls`, `/social`, `/calendar`, `/upload`, `/ads`, `/businesses`, `/kyc`, `/payment`, `/link-preview`, `/admin`.

### Frontend (`frontend/src`)

| Folder | Holds |
|---|---|
| `main.jsx`, `App.jsx` | Entry point and every route. |
| `api/` | One module per backend area. `client.js` is the shared axios instance (auth token, refresh on 401). Components call these, never axios directly. |
| `context/` | App-wide state: `AuthContext` (who is signed in), `ChatContext` (conversations, messages, the open chat), `SocketContext`, `ToastContext`, `AdContext`. |
| `pages/` | One component per route. |
| `components/` | UI grouped by area: `chat`, `contacts`, `groups`, `calls`, `settings`, `profile`, `business`, `calendar`, `marketing`, `layout`, `ui` (shared building blocks), and others. |
| `features/` | Self-contained flows: `signup`, `payment`. |
| `admin/` | The admin panel: its own pages, layout and API client. |
| `hooks/` | Reusable hooks (`useAgoraCall`). |
| `utils/` | Pure helpers with no UI: plan checks, role labels, cookie consent, reply previews. |
| `config/` | Site-wide constants (see Configuration). |

---

## Conventions

- **Files:** React components in `PascalCase.jsx`; everything else `camelCase.js`. Backend files are named by role: `user.controller.js`, `user.routes.js`, `kyc.service.js`.
- **Where logic goes:** fetching and rules live in `api/`, `context/` or `utils/`, and components render. On the backend, SQL lives only in `db/queries/`.
- **Errors:** backend controllers pass errors to `next(err)`. The global handler logs them and returns `{ error }` without leaking internals. Frontend calls show a toast (`useToast`) with a plain-language message. An empty `catch {}` is only acceptable where failure truly does not matter, such as browser storage, and should say why in a comment.
- **Styling:** Tailwind classes. Dark mode in the app is a `darkMode` prop. On the marketing pages it is the `night:` variant, keyed off `data-theme="dark"`.
- **Copy:** user-facing text is plain language. Avoid dashes in sentences.
- **Database changes:** add a new numbered file in `db/migrations/`. Never edit one that has already shipped.
