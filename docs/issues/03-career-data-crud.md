---
title: "Career data CRUD — all entity types"
type: enhancement
status: ready-for-agent
slice: AFK
blocked_by: "02-database-schema"
stories: US1
---

## What To Build

Build the Career Data section: the single source of truth for all career information. Users can create, view, edit, and delete records for all five entity types — Work Experience, Projects, Education, Skills, and Certifications.

End-to-end behavior: user visits the Career Data section, sees tabbed or sectioned lists of all their entries, can add a new work experience via a form, edit it inline or via modal, and delete it with a confirmation. Same for all other entity types.

- Next.js API routes (App Router route handlers) for CRUD on all five entity types
- Career Data page with sections/tabs for each entity type
- Form UI for each entity type (fields match schema from issue #2)
- List view showing all records per type with edit + delete actions
- GSAP animations: list item entrance, form open/close, delete confirmation
- Optimistic UI updates where appropriate
- API route-level tests for create, update, delete on at least WorkExperience and Project

## Acceptance Criteria

- [ ] User can create a new record for each of the five entity types
- [ ] User can edit any existing record
- [ ] User can delete a record (with confirmation)
- [ ] All changes persist to Supabase and survive page refresh
- [ ] List views show all records with correct data
- [ ] GSAP animations on list entrance and form transitions
- [ ] API routes return correct status codes and error messages
- [ ] Tests pass for WorkExperience and Project CRUD routes
