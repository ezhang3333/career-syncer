# Career Syncer — Product Requirements Document

> **Status:** Draft — pending publish to GitHub Issues
> **Phase:** Greenfield

---

## Problem Statement

Managing a career across multiple surfaces (resume, LinkedIn, portfolio, job applications, professional network) is fragmented and manual. Every time a new role, project, or skill is added, the same information has to be updated in multiple places independently. There is no single source of truth, resumes are hard to tailor without rebuilding them each time, and networking contacts are scattered with no structured way to act on them.

---

## Solution

A personal career management web application with a single source of truth for all career data (experiences, projects, education, skills). From that data store, the user can build multiple tailored resumes via drag-and-drop, manage their LinkedIn profile data with prompts to sync manually, track job applications on a Kanban board, and manage their professional network via a hierarchical clustered visualization with AI-assisted outreach drafting.

---

## User Stories

1. As a user, I want to enter my work experience, projects, education, and skills once, so that I never have to re-enter the same information across different tools.
2. As a user, I want to drag items from my data store onto a resume template, so that I can tailor different resumes for different roles without duplicating content.
3. As a user, I want to choose from pre-built resume templates or upload my own, so that I can control the visual presentation of my resume.
4. As a user, I want to maintain my LinkedIn profile data inside the app, so that the app is my authoritative record and I can update LinkedIn manually when prompted.
5. As a user, I want to be reminded to update LinkedIn whenever I modify career data, so that my LinkedIn stays consistent without requiring API access.
6. As a user, I want to push portfolio updates to my GitHub Pages site via the GitHub API, so that my portfolio reflects my current career data without manual file editing.
7. As a user, I want a Kanban board to track job applications by stage, so that I can see my pipeline at a glance.
8. As a user, I want to link job applications to contacts in my network, so that I know who I know at each company I'm applying to.
9. As a user, I want to store professional contacts organized by company and category, so that I can manage my network over time in one place.
10. As a user, I want to view my network as an interactive clustered visualization (category → company → person), so that I can explore my connections spatially.
11. As a user, I want to select a contact and generate an AI-drafted outreach message (cold email, follow-up, LinkedIn DM), so that I have a quality starting point without writing from scratch.

---

## Implementation Decisions

- **Stack:** Next.js (App Router), PostgreSQL via Supabase, Vercel hosting, no authentication layer (personal tool)
- **Frontend motion:** GSAP for UI-wide transitions and micro-interactions; Three.js scoped to the networking cluster visualization
- **Data model — source of truth entities:** `WorkExperience`, `Project`, `Education`, `Skill`, `CertificationOrAward` — each is a standalone record that can be referenced by multiple resumes
- **Resume model:** A resume is a named collection of references to source-of-truth items, bound to a template. The template controls layout; the items supply content.
- **Resume templates:** 2–3 pre-built templates ship with the app. Custom templates can be uploaded. Templates define slots (e.g. "experience section", "skills section") that accept dropped items.
- **LinkedIn section:** A structured form mirroring LinkedIn's profile sections (summary, experience, education, skills, certifications). Populated manually. On any career data update, the app shows a reminder banner to sync LinkedIn.
- **Portfolio → GitHub Pages:** The app stores a GitHub repo + branch config. On portfolio-relevant updates, it constructs a commit via the GitHub REST API (no local git required) and pushes to the configured repo. The portfolio site is expected to be a static site that reads from a data file in that repo.
- **Application tracking:** Kanban with default columns: Wishlist, Applied, Phone Screen, Interview, Offer, Rejected, Archived. Columns are reorderable. Each card can link to one or more CRM contacts.
- **Networking CRM:** Contacts have fields: name, company, category (e.g. Tech, Government, Finance), role, how-met, notes, last-contacted date, LinkedIn URL. The cluster viz groups by category → company → contact using Three.js with GSAP-driven expand/collapse transitions.
- **AI outreach drafting:** User selects a contact + message type (cold outreach, follow-up, LinkedIn DM, thank-you). The AI receives the contact's CRM record as context and returns a draft. No direct send — user copies and sends manually. AI provider: Claude API.

---

## Testing Decisions

- This is a greenfield project with no existing test seams. Establish tests at the API route layer (Next.js route handlers) as the primary seam — these are the highest testable boundary between data and UI.
- Data integrity tests: verify that updating a source-of-truth entity (e.g. editing a `WorkExperience`) propagates correctly to all resumes referencing it.
- GitHub Pages push: mock the GitHub REST API in tests; assert correct commit payload shape.
- AI drafting: mock the Claude API; assert that the contact's CRM data is included in the prompt context.
- Drag-and-drop resume builder: test at the state-management layer (what items are in which resume slots), not at the DOM interaction layer.

---

## Out of Scope

- LinkedIn API read/write integration
- Multi-user support, authentication, billing
- Portfolio site template builder (user owns and maintains their own GitHub Pages site)
- Direct email/LinkedIn message sending
- Mobile-native app
- PDF parsing / resume import
- Real-time collaboration

---

## Further Notes

### Phased Delivery

| Phase | Features |
|-------|----------|
| 1 — MVP | Source of truth data entry, resume builder (drag-and-drop), LinkedIn section |
| 2 | Application tracking Kanban, networking CRM (list view + cluster viz) |
| 3 | GitHub Pages push, AI outreach drafting, Three.js cluster visualization |

### Frontend Constraints
- GSAP for all UI transitions and micro-interactions across the full app
- Three.js scoped to the networking cluster visualization (Phase 3)
- `12-principles-of-animation` skill confirmed loaded — apply when implementing animations
- `ui-ux-pro-max` skill installed via plugin marketplace — may need Claude Code restart to appear

### GitHub Issues
To publish this PRD as a GitHub Issue, run `gh auth login` then:
```
gh issue create --repo ezhang3333/career-syncer --title "PRD: Career Syncer" --label "type: enhancement,status: ready-for-agent" --body-file docs/PRD.md
