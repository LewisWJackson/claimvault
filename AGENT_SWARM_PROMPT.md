# ClaimVault — Agent Swarm Production Deployment Prompt

## SETUP INSTRUCTIONS (Do these BEFORE pasting the prompt below)

### Step 1: Install tmux (if not already installed)
```bash
brew install tmux
```

### Step 2: Start a tmux session
```bash
tmux
```
You should see a green bar at the bottom of your terminal.

### Step 3: Enable Agent Teams in Claude Code
```bash
claude
# Then inside Claude Code, type:
/config
# Add this to your settings:
# "claude_experimental_agent_teams": true
```
Or manually edit `~/.claude/settings.json` and add:
```json
{
  "claude_experimental_agent_teams": true
}
```

### Step 4: Navigate to the project and launch Claude Code
```bash
cd ~/claimvault
claude --dangerously-skip-permissions
```

### Step 5: Paste the prompt below

---

## THE PROMPT

```
You are taking over a Next.js 14 project called ClaimVault — a crypto YouTuber accountability platform that tracks XRP creator predictions, verifies them against reality, and ranks creators by accuracy.

The codebase is COMPLETE (24 source files, ~3,800 lines, zero TypeScript errors) and pushed to GitHub at https://github.com/LewisWJackson/claimvault.git — but the Railway deployment is broken. The app builds successfully and starts up fine (logs show "Ready in 82ms" on 0.0.0.0:8080), but Railway shows "Application failed to respond" when you visit the URL.

I need you to spawn a team of agents to fix this and get the entire project running in production. Here is everything you need to know:

---

## CRITICAL ISSUE: Railway "Application failed to respond"

The app builds, the container starts, Next.js reports ready on 0.0.0.0:8080, but Railway cannot route traffic to it. Things already tried:
- Fixed Dockerfile: changed `npm ci --omit=dev` to `npm ci` (devDeps needed for build)
- Upgraded Next.js from 14.2.15 to 14.2.35 (fixed CVE-2025-55184 and CVE-2025-67779)
- Set HOSTNAME=0.0.0.0 inline in Dockerfile CMD (not as ENV, to prevent container runtime override)
- Removed startCommand and healthcheck from railway.json
- Tested locally: standalone server starts in 82ms, all routes return HTTP 200

Current Dockerfile:
```dockerfile
FROM node:20-alpine AS base
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD HOSTNAME=0.0.0.0 node server.js
```

Current railway.json:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Railway environment variables already set: APIFY_TOKEN, ANTHROPIC_API_KEY, COINGECKO_API_KEY
Railway URL: claimvault-production.up.railway.app

---

## PROJECT ARCHITECTURE

Tech Stack: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Recharts
Data Layer: In-memory JSON (seed.ts has 15 creators, 45 videos, 52 claims — Prisma schema exists for future DB migration)
Deployment: Railway with Dockerfile (standalone output mode)
GitHub: https://github.com/LewisWJackson/claimvault.git

File Structure:
```
claimvault/
├── package.json          (next@^14.2.35, react@^18, recharts, framer-motion, lucide-react, apify-client, @prisma/client)
├── next.config.mjs       (output: 'standalone', remotePatterns for yt3.ggpht.com, i.ytimg.com, ui-avatars.com)
├── tailwind.config.ts    (custom vault theme: orange #f97316, purple, cyan, custom animations)
├── Dockerfile            (multi-stage Node 20 Alpine, standalone output)
├── railway.json
├── prisma/schema.prisma  (Creator, Video, Claim, CreatorScore, Suggestion models — NOT used at runtime yet)
├── src/
│   ├── app/
│   │   ├── layout.tsx        (root layout with Google Fonts Inter, gradient background, Navigation, footer)
│   │   ├── page.tsx          (homepage: hero, market pulse strip, top 5 creators, latest 6 claims)
│   │   ├── globals.css       (glassmorphism .glass-card, .gradient-text, custom scrollbar, status badges)
│   │   ├── creators/
│   │   │   ├── page.tsx      (leaderboard: client-side sorting, top 3 podium with radar charts, full ranking list)
│   │   │   └── [id]/page.tsx (creator profile: radar chart, stats, filtered claims table, tracked videos)
│   │   ├── claims/page.tsx   (claim feed: search, status filters, category filters, grid layout)
│   │   ├── pulse/page.tsx    (market sentiment: community bar, creator stances, platform stats, recent verifications)
│   │   ├── suggest/page.tsx  (submit creator form with URL validation)
│   │   └── api/
│   │       ├── creators/route.ts  (GET: all creators or by ID)
│   │       ├── claims/route.ts    (GET: filtered by status/category/creatorId)
│   │       ├── suggest/route.ts   (POST: validate YouTube URL, log suggestion)
│   │       └── scrape/route.ts    (POST: Bearer token auth, triggers Apify pipeline)
│   ├── components/
│   │   ├── Navigation.tsx    (top nav: logo, 5 nav items, active state, mobile responsive)
│   │   ├── RadarChart.tsx    (Recharts 6-axis radar: Price/Timeline/Regulatory/Partner/Tech/Market)
│   │   ├── StatCard.tsx      (animated stat cards with framer-motion, gradient colors)
│   │   ├── CreatorCard.tsx   (rank + trend icon, avatar, name + tier, accuracy %, claims count)
│   │   ├── ClaimCard.tsx     (creator info, claim text, status/category badges, timeframe, verification notes)
│   │   ├── TierBadge.tsx     (diamond/gold/silver/bronze with emoji and color coding)
│   │   └── SuggestForm.tsx   (YouTube URL input, validation, loading state, success state)
│   ├── lib/
│   │   ├── db.ts             (in-memory queries: getAllCreators, getClaimsWithCreators, getMarketPulse, etc.)
│   │   ├── apify.ts          (Apify client: scrapeChannelVideos, scrapeTranscripts, processNewCreator)
│   │   ├── scoring.ts        (calculateAccuracy, calculateTier, calculateWeightedAccuracy, rankCreators)
│   │   └── types.ts          (TypeScript types, color/label utilities for tiers, statuses, categories)
│   └── data/
│       └── seed.ts           (1,645 lines: 15 real XRP creators with demo accuracy scores, 45 videos, 52 claims)
```

15 Tracked Creators: Blockchain Backer, Digital Perspectives, Digital Asset Investor, Crypto Eri, Moon Lambo, Thinking Crypto, CoinsKid, Working Money Channel, The Bearable Bull, On The Chain, DustyBC Crypto News, Kevin Cage, XRP Right Now, Coinclubcrypto, XRP Bags

Design: Dark theme — deep navy/purple backgrounds, glassmorphism cards, coral→magenta→purple gradient accents, animated radar charts. Inspired by ESPN player stats dashboards.

---

## KNOWN ISSUES TO FIX

1. **Railway deployment — "Application failed to respond"**: The #1 priority. App builds and starts but Railway can't route traffic. Might be a PORT/networking config issue, Docker CMD issue, or Railway service configuration problem. Research Railway Next.js standalone deployment best practices and fix this.

2. **@prisma/client in dependencies but never used**: It's in package.json dependencies but no source file imports it. Its postinstall hook runs `prisma generate` which adds unnecessary build time. Remove it from dependencies (keep prisma in devDeps for future migration).

3. **Security: dev-key fallback in scrape API**: `src/app/api/scrape/route.ts` has `process.env.SCRAPE_API_KEY || 'dev-key'` which means any request with `Bearer dev-key` works in production. Generate a proper secret and require it.

4. **No error boundaries or loading states**: Pages don't have error.tsx or loading.tsx files.

5. **Raw <img> tags instead of next/image**: Multiple components use raw HTML img tags with nullable avatarUrl.

---

## AGENT TEAM PLAN

Please spawn a team of agents to work on this in parallel:

### Agent 1: Railway Deployment Fixer (HIGHEST PRIORITY)
- Research why Next.js 14 standalone apps fail on Railway with "Application failed to respond"
- Check Railway docs, GitHub issues, and community solutions
- The app starts fine (0.0.0.0:8080, ready in 82ms) but Railway can't route to it
- Try alternative approaches: different Dockerfile patterns, different railway.json configs
- Consider if we need to switch from standalone to standard Next.js server mode
- Test the Docker build locally with `docker build` and `docker run` to verify it works in a real container
- Fix and push the solution
- IMPORTANT: If standalone mode is the issue, try `output: undefined` in next.config.mjs with `CMD ["npm", "start"]` as a fallback approach

### Agent 2: Code Quality & Production Hardening
- Remove @prisma/client from dependencies (keep prisma in devDependencies for future use)
- Fix the dev-key security vulnerability in scrape API route
- Replace raw <img> tags with next/image or add proper null checks
- Add error.tsx and loading.tsx files for each route
- Add proper TypeScript strict checks
- Ensure all environment variables have proper fallbacks or validation
- Make sure the Apify client doesn't crash if APIFY_TOKEN is missing (lazy initialization)

### Agent 3: Build Verification & Testing
- Run `npm run build` and verify zero errors
- Test all API routes work correctly
- Verify the Docker build works: `docker build -t claimvault .` and `docker run -p 3000:3000 claimvault`
- Test every page renders correctly with the standalone server
- Verify no TypeScript errors
- Run a lighthouse-style check on the built output

### Agent 4: Git & Deployment Pipeline
- Once Agent 1's fix is ready, commit all changes with clear messages
- Push to GitHub
- Verify Railway picks up the new deployment
- Monitor the Railway deployment logs
- Confirm the live URL serves the app correctly
- Set up proper Railway configuration for auto-deploys from main branch

COORDINATE BETWEEN AGENTS: If Agent 1 finds the Railway fix requires code changes, notify Agent 2. If Agent 2's changes break the build, notify Agent 3. Agent 4 should wait for Agents 1-3 to complete before pushing.

The end goal: https://claimvault-production.up.railway.app loads ClaimVault with all pages working.
```
