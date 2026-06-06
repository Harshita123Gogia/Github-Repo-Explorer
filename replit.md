# GitHub Repo Explorer

A full-stack web application that lets users search any GitHub username and explore their public profile, repositories, and language distribution. The Node.js backend proxies all GitHub API requests with 60-second server-side caching to avoid rate limits.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/github-explorer run dev` — run the frontend (port 18759)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (GitHub proxy with in-memory cache)
- Frontend: React 19 + Vite + Tailwind CSS v4 + shadcn/ui
- Data fetching: TanStack Query (React Query)
- Charts: Recharts
- Validation: Zod + Orval codegen from OpenAPI spec

## Where things live

- `artifacts/api-server/src/routes/github.ts` — GitHub proxy routes + cache logic
- `artifacts/github-explorer/src/pages/home.tsx` — main SPA page
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-zod/` — generated Zod schemas
- `lib/api-client-react/` — generated React Query hooks

## Architecture decisions

- Backend proxies all GitHub API calls — credentials never touch the browser
- In-memory cache keyed by `username + sort + page` with 60s TTL reduces GitHub rate limit pressure
- OpenAPI spec is the single source of truth — Zod validators and React Query hooks are both generated from it via Orval
- All query params use coercion so string values from HTTP are safely cast to numbers/booleans

## User preferences

- Dark theme by default
- No emojis in the UI
