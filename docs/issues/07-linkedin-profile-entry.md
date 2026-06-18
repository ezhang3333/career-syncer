---
title: "LinkedIn profile data entry"
type: enhancement
status: ready-for-agent
slice: AFK
blocked_by: "02-database-schema"
stories: US4
---

## What To Build

Build the LinkedIn section: a structured form where the user enters and maintains their LinkedIn profile data. The app becomes the authoritative source for this data; LinkedIn itself is updated manually by the user.

End-to-end behavior: user visits the LinkedIn section, sees a profile form with fields matching LinkedIn's structure, fills in their headline and summary, and the data saves to Supabase. Returning to the page shows the saved data pre-filled.

- LinkedIn page at `/linkedin`
- Profile form sections: Headline, Summary, (links through to source-of-truth for Experience, Education, Skills, Certifications — no duplication)
- API routes for reading and updating the `linkedin_profile` record
- GSAP form section entrance animations
- The page also displays a read-only view of linked source-of-truth data (work experiences, education, skills) so the user can see what their LinkedIn "profile" looks like in aggregate

## Acceptance Criteria

- [ ] User can enter and save a LinkedIn headline and summary
- [ ] Saved data persists to Supabase and pre-fills on return visits
- [ ] Page displays source-of-truth experience, education, and skills in a LinkedIn-profile-like layout
- [ ] API routes return correct data on GET and update correctly on PUT
- [ ] GSAP animations play on section entrance
