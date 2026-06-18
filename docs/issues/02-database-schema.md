---
title: "Database schema migrations"
type: enhancement
status: ready-for-agent
slice: AFK
blocked_by: "01-project-scaffolding"
stories: foundation for US1, US2, US3, US4, US5
---

## What To Build

Define and apply the full Phase 1 database schema to Supabase via migrations. All source-of-truth career data tables, resume tables, and LinkedIn profile table should exist and be queryable after this issue is complete.

End-to-end behavior: migrations run cleanly against the Supabase project; all tables are visible in the Supabase dashboard.

### Tables

**Source of truth**
- `work_experiences` — id, title, company, location, start_date, end_date (nullable), is_current, description (text[]), created_at, updated_at
- `projects` — id, name, description, url, tech_stack (text[]), start_date, end_date (nullable), created_at, updated_at
- `education` — id, institution, degree, field_of_study, start_date, end_date (nullable), gpa (nullable), created_at, updated_at
- `skills` — id, name, category, proficiency_level, created_at, updated_at
- `certifications` — id, name, issuer, issue_date, expiry_date (nullable), url (nullable), created_at, updated_at

**Resume**
- `resumes` — id, name, template_id, created_at, updated_at
- `resume_items` — id, resume_id (FK), entity_type (enum: work_experience | project | education | skill | certification), entity_id (uuid), position (int), section (text), created_at

**LinkedIn**
- `linkedin_profile` — id, headline, summary, created_at, updated_at
- (LinkedIn experience/education/skills are sourced from the source-of-truth tables, not duplicated)

## Acceptance Criteria

- [ ] All migrations apply cleanly via Supabase CLI or dashboard
- [ ] All tables are visible and queryable in the Supabase dashboard
- [ ] Foreign key constraints and indexes are in place (resume_items → resumes)
- [ ] `entity_type` enum is defined and enforced
- [ ] No breaking changes to any existing tables (greenfield — N/A)
