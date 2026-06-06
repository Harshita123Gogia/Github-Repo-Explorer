# GitHub Repo Explorer

**Exercise 3 — GitHub Repo Explorer**

A full-stack web application where users can search any GitHub username and instantly explore their public profile and repositories. The Node.js backend acts as a proxy between the browser and the GitHub API, adding server-side caching to reduce rate-limit pressure and keeping API credentials off the client. The React frontend displays the user's avatar, bio, stats, a sortable and paginated repository list, expandable repo detail cards, and a language distribution chart — all with skeleton loading states and graceful error handling.

---

## Live Demo

[https://Github-Repo-Explorer--HarshitaGogia.replit.app](https://Github-Repo-Explorer--HarshitaGogia.replit.app)

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend runtime | Node.js 24 + TypeScript | Familiar, fast, and the brief required it |
| Backend framework | Express 5 | Lightweight, well-understood REST framework |
| Frontend framework | React 19 + Vite | Fast dev server, first-class hooks support |
| Styling | Tailwind CSS v4 + shadcn/ui | Utility-first CSS with polished accessible primitives |
| Data fetching | TanStack Query (React Query) | Built-in loading/error states, cache key management |
| Charts | Recharts | Declarative, React-native charting with minimal setup |
| API contract | OpenAPI 3.1 + Orval codegen | Type-safe hooks and Zod validators generated from a single spec — no drift between client and server |
| Validation | Zod | Runtime schema validation on all inputs and outputs |
| Monorepo | pnpm workspaces | Shared libraries (`api-zod`, `api-client-react`) between packages |

---

## How to Run Locally

> Assumes Node.js 20+ is installed. All other tools are installed via the commands below.

```bash
# 1. Install pnpm
npm install -g pnpm

# 2. Clone the repo
git clone https://github.com/YOUR_USERNAME/Github-Repo-Explorer.git
cd Github-Repo-Explorer

# 3. Install all dependencies
pnpm install

# 4. (Optional) Add a GitHub token to raise the rate limit from 60 to 5000 req/hr
#    Create a .env file in artifacts/api-server/
echo "GITHUB_TOKEN=your_token_here" > artifacts/api-server/.env

# 5. Start the API server (runs on port 8080)
pnpm --filter @workspace/api-server run dev

# 6. In a second terminal, start the frontend (runs on port 5173)
pnpm --filter @workspace/github-explorer run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note:** Without a GitHub token you get 60 unauthenticated requests per hour. The app surfaces rate-limit errors clearly and shows when the limit resets.

---

## API Documentation

All endpoints are prefixed with `/api`. The frontend never calls the GitHub API directly — all requests go through this backend.

---

### `GET /api/healthz`

Health check.

**Response `200`**
```json
{ "status": "ok" }
```

---

### `GET /api/github/user`

Fetch a GitHub user's public profile. Responses are cached for 60 seconds.

**Query Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `username` | string | yes | GitHub username |

**Response `200`**
```json
{
  "login": "torvalds",
  "name": "Linus Torvalds",
  "avatar_url": "https://avatars.githubusercontent.com/u/1024025?v=4",
  "bio": null,
  "followers": 305963,
  "following": 0,
  "public_repos": 12,
  "html_url": "https://github.com/torvalds",
  "location": "Portland, OR",
  "company": "Linux Foundation",
  "blog": "",
  "created_at": "2011-09-03T15:26:22Z",
  "cached": false
}
```

**Response `404`**
```json
{ "error": "GitHub user \"torvalds\" not found" }
```

**Response `429`**
```json
{
  "error": "GitHub API rate limit exceeded. Please try again later.",
  "rateLimitReset": 1749220800000
}
```

---

### `GET /api/github/repos`

Fetch a user's public repositories with sorting and pagination. Responses are cached per `username + sort + page + per_page` combination for 60 seconds.

**Query Parameters**

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `username` | string | yes | — | GitHub username |
| `sort` | `stars` \| `name` \| `updated` | no | `stars` | Sort order |
| `page` | integer | no | `1` | Page number |
| `per_page` | integer | no | `30` | Results per page |

**Response `200`**
```json
{
  "repos": [
    {
      "id": 2325298,
      "name": "linux",
      "full_name": "torvalds/linux",
      "description": "Linux kernel source tree",
      "html_url": "https://github.com/torvalds/linux",
      "language": "C",
      "stargazers_count": 187000,
      "forks_count": 55000,
      "open_issues_count": 349,
      "default_branch": "master",
      "updated_at": "2025-06-05T12:00:00Z",
      "created_at": "2011-09-04T22:08:37Z",
      "fork": false,
      "topics": ["kernel", "linux"],
      "visibility": "public",
      "watchers_count": 187000
    }
  ],
  "total_count": 12,
  "page": 1,
  "per_page": 30,
  "has_more": false,
  "cached": false
}
```

---

### `GET /api/github/languages`

Aggregate primary language counts across all of a user's repos (up to 100 most recently updated). Cached for 60 seconds.

**Query Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `username` | string | yes | GitHub username |

**Response `200`**
```json
{
  "languages": [
    { "language": "C", "count": 6 },
    { "language": "Python", "count": 3 },
    { "language": "Shell", "count": 2 }
  ],
  "cached": false
}
```

---

## Project Structure

```
Github-Repo-Explorer/
│
├── artifacts/
│   ├── api-server/               # Express backend
│   │   └── src/
│   │       ├── routes/
│   │       │   ├── github.ts     # GitHub proxy + in-memory cache
│   │       │   └── health.ts     # /healthz
│   │       ├── lib/
│   │       │   └── logger.ts     # Pino structured logger
│   │       ├── app.ts            # Express app setup
│   │       └── index.ts          # Server entry point
│   │
│   └── github-explorer/          # React + Vite frontend
│       └── src/
│           ├── pages/
│           │   └── home.tsx      # Main single-page view
│           ├── hooks/
│           │   └── use-recent-searches.ts  # localStorage hook
│           ├── components/ui/    # shadcn/ui primitives
│           ├── App.tsx
│           └── index.css         # Tailwind theme + CSS variables
│
├── lib/
│   ├── api-spec/
│   │   └── openapi.yaml          # Single source of truth for all endpoints
│   ├── api-zod/                  # Generated Zod schemas (from openapi.yaml)
│   └── api-client-react/         # Generated React Query hooks (from openapi.yaml)
│
└── pnpm-workspace.yaml           # Workspace config
```

---

## Next Steps

**What I chose not to do (and why)**

- **GitHub OAuth / personal token UI** — would require a secrets flow; skipped to keep the demo zero-config for reviewers
- **Persistent cache** (Redis / SQLite) — in-memory is sufficient for a demo and avoids infra setup; a production system would use Redis with a TTL
- **Search-as-you-type with debounce** — added to the backlog; current UX requires pressing Enter, which avoids hammering the API on every keystroke
- **Backend tests** — ran out of time; I would add Vitest unit tests for the cache logic and route handlers using `supertest`

**What I would build next**

1. **Debounced search-as-you-type** with a 400ms delay and loading indicator
2. **Repo search / filter** within the current profile (filter by language, fork status, or keyword)
3. **Compare mode** — search two usernames side-by-side
4. **GitHub OAuth** — authenticated requests raise the rate limit from 60 to 5000 req/hr and unlock private repo counts
5. **Vitest integration tests** on the Express routes using `supertest` to cover cache hits, 404s, and rate-limit responses
6. **PWA manifest + offline support** — cache the last viewed profile in the service worker for offline access
