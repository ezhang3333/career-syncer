---
title: "Resume creation & template selection"
type: enhancement
status: ready-for-agent
slice: AFK
blocked_by: "02-database-schema"
stories: US3
---

## What To Build

Build the resume management layer: creating named resumes, picking a template, and the template rendering foundation. This is the scaffold the drag-and-drop builder (issue #5) plugs into.

End-to-end behavior: user visits the Resumes section, sees a list of their resumes, clicks "New Resume", names it, picks a template from 2 pre-built options (Classic, Modern), and lands on a resume editor canvas showing the empty template with labeled slots.

- Resumes list page with create/delete resume actions
- Template picker UI showing Classic and Modern as visual previews
- API routes for creating, listing, and deleting resumes
- Resume editor page/route (`/resumes/[id]`) that renders the selected template with empty slots
- Template slot system: each template defines named sections (Experience, Projects, Education, Skills) that will accept items in issue #5
- GSAP transitions: template picker card selection, entering the editor

## Acceptance Criteria

- [ ] User can create a new resume with a name
- [ ] User can pick Classic or Modern template
- [ ] Resume is saved to Supabase with template_id
- [ ] Resume editor page loads and renders the correct template structure
- [ ] Template slots are visually distinct and labeled
- [ ] User can delete a resume from the list
- [ ] GSAP transition plays when entering the resume editor
