---
title: "GitHub Pages portfolio push via GitHub REST API"
type: enhancement
status: ready-for-agent
slice: Phase 3
blocked_by: "03-career-data-crud"
stories: US6
---

## What To Build

Allow the user to push their career data as a portfolio update to a GitHub Pages site via the GitHub REST API. No local git required — the app constructs and commits a data file directly via API.

End-to-end behavior: user visits a Portfolio settings page, enters their GitHub repo name, branch, and personal access token (stored in Supabase or `.env.local`). They click "Push Portfolio" and the app reads their current career data, serializes it to a JSON file, and creates/updates a commit on their GitHub Pages repo via the REST API. A success or error toast appears.

### What to build
- Portfolio settings page at `/portfolio` (or settings section) with fields: GitHub repo (owner/repo), branch, PAT
- Settings saved to Supabase (`portfolio_config` table) or `.env.local` if simpler
- API route `POST /api/portfolio/push` that:
  - Reads all career data from Supabase
  - Constructs a `career-data.json` payload
  - Uses GitHub REST API to create or update the file at a configurable path (default: `data/career-data.json`)
  - Returns success/error
- Toast feedback after push (GSAP entrance/exit animation)
- GitHub REST API call mocked in tests; assert correct payload shape and correct file path

### GitHub REST API notes
- Use `PUT /repos/{owner}/{repo}/contents/{path}` to create or update a file
- Must include `message`, `content` (base64-encoded), and `sha` (if updating existing file — fetch current file first)
- Auth via `Authorization: Bearer <PAT>` header

## Acceptance Criteria

- [ ] User can configure GitHub repo, branch, and PAT via the Portfolio settings page
- [ ] Clicking "Push Portfolio" calls the API route which commits `career-data.json` to the configured repo
- [ ] The JSON payload includes all current WorkExperience, Project, Education, Skill, and Certification records
- [ ] If the file already exists, the push updates it (correct `sha` handling)
- [ ] Success and error states are surfaced via toast
- [ ] GSAP animation plays on toast entrance/exit
- [ ] Tests mock the GitHub REST API and assert correct payload shape
