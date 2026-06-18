---
title: "Project scaffolding & base layout"
type: enhancement
status: ready-for-agent
slice: AFK
blocked_by: none
stories: foundation for all user stories
---

## What To Build

Initialize the Career Syncer web application from scratch. This is the foundation every other issue depends on. Deliver a running Next.js app connected to Supabase with a navigation shell, GSAP wired up, and a live Vercel deployment.

End-to-end behavior: visiting the deployed URL shows a navigable shell with placeholder pages for Career Data, Resumes, LinkedIn, with smooth GSAP page transitions between them.

- Init Next.js App Router project with TypeScript and Tailwind
- Connect to Supabase (client + server-side client setup)
- Install and configure GSAP for global use
- Build a persistent sidebar/topbar navigation with links to: Career Data, Resumes, LinkedIn
- Placeholder page content for each section (empty state UI)
- Deploy to Vercel, confirm live URL works
- Set up environment variable handling (.env.local with Supabase URL + anon key)

## Acceptance Criteria

- [ ] `npm run dev` starts without errors
- [ ] App is deployed to Vercel and accessible at a live URL
- [ ] Navigation shell renders with links to Career Data, Resumes, LinkedIn
- [ ] Navigating between sections uses a GSAP transition (fade or slide)
- [ ] Supabase client is initialized and importable from API routes and server components
- [ ] No TypeScript errors on build
