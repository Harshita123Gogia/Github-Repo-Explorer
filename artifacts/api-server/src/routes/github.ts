import { Router, type IRouter } from "express";
import {
  GetGithubUserQueryParams,
  GetGithubUserResponse,
  GetGithubReposQueryParams,
  GetGithubReposResponse,
  GetGithubLanguagesQueryParams,
  GetGithubLanguagesResponse,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const CACHE_TTL_MS = 60 * 1000;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

const GITHUB_API_BASE = "https://api.github.com";

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "github-repo-explorer",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function githubFetch(path: string): Promise<Response> {
  return fetch(`${GITHUB_API_BASE}${path}`, { headers: buildHeaders() });
}

router.get("/github/user", async (req, res): Promise<void> => {
  const parsed = GetGithubUserQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username } = parsed.data;
  const cacheKey = `user:${username}`;
  const cached = getCached<unknown>(cacheKey);

  if (cached) {
    req.log.info({ username }, "Cache hit for user");
    res.json(GetGithubUserResponse.parse({ ...cached, cached: true }));
    return;
  }

  const response = await githubFetch(`/users/${encodeURIComponent(username)}`);

  if (response.status === 404) {
    res.status(404).json({ error: `GitHub user "${username}" not found` });
    return;
  }

  if (response.status === 403 || response.status === 429) {
    const resetHeader = response.headers.get("X-RateLimit-Reset");
    const rateLimitReset = resetHeader ? parseInt(resetHeader, 10) * 1000 : null;
    req.log.warn({ username, rateLimitReset }, "GitHub rate limit hit");
    res.status(429).json({
      error: "GitHub API rate limit exceeded. Please try again later.",
      rateLimitReset,
    });
    return;
  }

  if (!response.ok) {
    logger.error({ status: response.status, username }, "GitHub API error for user");
    res.status(500).json({ error: "Failed to fetch user from GitHub" });
    return;
  }

  const data = await response.json() as Record<string, unknown>;
  setCached(cacheKey, data);

  res.json(GetGithubUserResponse.parse({ ...data, cached: false }));
});

router.get("/github/repos", async (req, res): Promise<void> => {
  const parsed = GetGithubReposQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, sort = "stars", page = 1, per_page = 30 } = parsed.data;

  const githubSort = sort === "stars" ? "stars" : sort === "name" ? "full_name" : "updated";
  const githubDirection = sort === "name" ? "asc" : "desc";

  const cacheKey = `repos:${username}:${sort}:${page}:${per_page}`;
  const cached = getCached<unknown>(cacheKey);

  if (cached) {
    req.log.info({ username, sort, page }, "Cache hit for repos");
    res.json(GetGithubReposResponse.parse({ ...(cached as object), cached: true }));
    return;
  }

  const params = new URLSearchParams({
    sort: githubSort,
    direction: githubDirection,
    page: String(page),
    per_page: String(per_page),
  });

  const response = await githubFetch(
    `/users/${encodeURIComponent(username)}/repos?${params}`
  );

  if (response.status === 404) {
    res.status(404).json({ error: `GitHub user "${username}" not found` });
    return;
  }

  if (response.status === 403 || response.status === 429) {
    const resetHeader = response.headers.get("X-RateLimit-Reset");
    const rateLimitReset = resetHeader ? parseInt(resetHeader, 10) * 1000 : null;
    req.log.warn({ username, rateLimitReset }, "GitHub rate limit hit");
    res.status(429).json({
      error: "GitHub API rate limit exceeded. Please try again later.",
      rateLimitReset,
    });
    return;
  }

  if (!response.ok) {
    logger.error({ status: response.status, username }, "GitHub API error for repos");
    res.status(500).json({ error: "Failed to fetch repositories from GitHub" });
    return;
  }

  const repos = await response.json() as unknown[];

  const linkHeader = response.headers.get("Link") || "";
  const hasMore = linkHeader.includes('rel="next"');

  const totalCountHeader = response.headers.get("X-Total-Count");
  const total_count = totalCountHeader ? parseInt(totalCountHeader, 10) : repos.length;

  const payload = {
    repos,
    total_count,
    page,
    per_page,
    has_more: hasMore,
  };

  setCached(cacheKey, payload);

  res.json(GetGithubReposResponse.parse({ ...payload, cached: false }));
});

router.get("/github/languages", async (req, res): Promise<void> => {
  const parsed = GetGithubLanguagesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username } = parsed.data;
  const cacheKey = `languages:${username}`;
  const cached = getCached<unknown>(cacheKey);

  if (cached) {
    req.log.info({ username }, "Cache hit for languages");
    res.json(GetGithubLanguagesResponse.parse({ ...(cached as object), cached: true }));
    return;
  }

  const response = await githubFetch(
    `/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`
  );

  if (response.status === 404) {
    res.status(404).json({ error: `GitHub user "${username}" not found` });
    return;
  }

  if (response.status === 403 || response.status === 429) {
    const resetHeader = response.headers.get("X-RateLimit-Reset");
    const rateLimitReset = resetHeader ? parseInt(resetHeader, 10) * 1000 : null;
    req.log.warn({ username, rateLimitReset }, "GitHub rate limit hit");
    res.status(429).json({
      error: "GitHub API rate limit exceeded. Please try again later.",
      rateLimitReset,
    });
    return;
  }

  if (!response.ok) {
    logger.error({ status: response.status, username }, "GitHub API error for languages");
    res.status(500).json({ error: "Failed to fetch languages from GitHub" });
    return;
  }

  const repos = await response.json() as Array<{ language?: string | null }>;

  const langCounts: Record<string, number> = {};
  for (const repo of repos) {
    if (repo.language) {
      langCounts[repo.language] = (langCounts[repo.language] ?? 0) + 1;
    }
  }

  const languages = Object.entries(langCounts)
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count);

  const payload = { languages };
  setCached(cacheKey, payload);

  res.json(GetGithubLanguagesResponse.parse({ ...payload, cached: false }));
});

export default router;
