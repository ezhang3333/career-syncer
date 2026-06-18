---
title: "LinkedIn sync reminder"
type: enhancement
status: ready-for-agent
slice: AFK
blocked_by: "03-career-data-crud, 07-linkedin-profile-entry"
stories: US5
---

## What To Build

Show a reminder to the user whenever career data is created or updated, prompting them to manually sync their LinkedIn profile.

End-to-end behavior: user adds a new work experience in the Career Data section. A toast/banner appears: "Career data updated — remember to sync your LinkedIn profile." The reminder includes a link to the LinkedIn section. The reminder dismisses automatically after a few seconds or on manual close.

- Toast or banner component that fires after any successful create or update in the Career Data section
- Reminder includes a direct link to `/linkedin`
- Reminder state is transient (not persisted — shows once per mutation, not on refresh)
- GSAP entrance/exit animation for the toast (follow ease-in/ease-out principles)
- Wired into the API response flow after successful mutations in issue #3 routes

## Acceptance Criteria

- [ ] Reminder appears after creating any career data record
- [ ] Reminder appears after editing any career data record
- [ ] Reminder contains a link that navigates to the LinkedIn section
- [ ] Reminder auto-dismisses after ~4 seconds or on manual close
- [ ] GSAP animation plays on enter and exit
- [ ] No reminder appears on delete operations (delete doesn't require LinkedIn update)
