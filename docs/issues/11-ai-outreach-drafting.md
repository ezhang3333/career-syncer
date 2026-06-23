---
title: "AI outreach drafting via Claude API"
type: enhancement
status: ready-for-agent
slice: Phase 3
blocked_by: "networking CRM (Phase 2 — complete)"
stories: US11
---

## What To Build

Let users select a CRM contact and a message type, and generate an AI-drafted outreach message via the Claude API. The draft is shown in the app for the user to copy and send manually — no direct send.

End-to-end behavior: user is on the networking page (list or viz view), clicks a contact's "Draft Outreach" button. A modal opens with a message-type picker (Cold Outreach, Follow-Up, LinkedIn DM, Thank You). User picks a type and clicks "Generate". The app calls an API route, which passes the contact's full CRM record as context to Claude and returns a draft. The draft renders in the modal with a "Copy" button. User dismisses when done.

### What to build
- "Draft Outreach" button on each contact row in the networking list view (and contact detail drawer from issue #10 if that's built)
- `DraftOutreachModal.tsx` component:
  - Message type picker: Cold Outreach | Follow-Up | LinkedIn DM | Thank You
  - Generate button → calls API route
  - Draft display area with "Copy to Clipboard" button
  - Loading and error states
  - GSAP modal entrance/exit animation
- API route `POST /api/contacts/[id]/draft-outreach`:
  - Accepts `{ messageType: string }`
  - Fetches contact record from Supabase by `id`
  - Builds a system prompt that includes the contact's name, company, role, category, how-met, notes, and last-contacted date
  - Calls Claude API (`claude-sonnet-4-6`) with the prompt and returns the draft text
  - Returns `{ draft: string }` on success
- Tests: mock the Claude API; assert that the contact's CRM fields appear in the prompt context for each message type

### Claude API usage
- Use `claude-sonnet-4-6` model
- System prompt should describe the user's intent (professional networking outreach) and inject the contact's CRM fields
- Keep `max_tokens` reasonable (500–800) — these are short outreach messages
- The API key should be read from `ANTHROPIC_API_KEY` env var (add to `.env.local`)

### Prompt structure (example for Cold Outreach)
```
System: You are helping draft a professional outreach message. The user wants to reach out to the following contact:
Name: {name}
Company: {company}
Role: {role}
Category: {category}
How we met: {how_met}
Notes: {notes}
Last contacted: {last_contacted}

Draft a concise, warm cold outreach message. Do not include a subject line. Output only the message body.
```

## Acceptance Criteria

- [ ] "Draft Outreach" button appears on each contact in the networking list
- [ ] Clicking opens a modal with message-type picker and Generate button
- [ ] Selecting a type and clicking Generate returns a draft within a few seconds
- [ ] Draft renders in the modal with a working "Copy to Clipboard" button
- [ ] Loading state shown while waiting for Claude API response
- [ ] Error state shown if API call fails
- [ ] GSAP animation on modal open and close
- [ ] API route includes full CRM contact record in Claude prompt context
- [ ] Tests mock Claude API and assert CRM fields appear in the constructed prompt
- [ ] `ANTHROPIC_API_KEY` is documented in `.env.local.example` (if one exists) or README
