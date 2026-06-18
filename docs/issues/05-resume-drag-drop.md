---
title: "Resume builder — drag-and-drop item assignment"
type: enhancement
status: ready-for-agent
slice: AFK
blocked_by: "03-career-data-crud, 04-resume-template-selection"
stories: US2
---

## What To Build

Implement the drag-and-drop resume builder. Users drag source-of-truth items from a sidebar panel onto template slots in the resume canvas. Selections are persisted so the resume remembers which items are included.

End-to-end behavior: user opens a resume, sees a sidebar with all their career data items grouped by type, drags a work experience onto the Experience slot, drags two projects onto the Projects slot, and the selections save automatically. Reloading the page restores the same selections.

- Item palette sidebar: lists all career data records grouped by entity type
- Drag-and-drop: items from sidebar can be dropped into the correct template slot
- Items within a slot can be reordered by dragging
- Items can be removed from a slot (dragged out or via remove button)
- `resume_items` records are created/updated/deleted in Supabase as items are added, removed, or reordered
- GSAP animations: item pickup, drop, reorder, removal — apply squash/stretch and anticipation principles
- State management tested at the reducer/state layer (not DOM), verifying correct `resume_items` shape after add/remove/reorder operations

## Acceptance Criteria

- [ ] Items from the sidebar can be dragged onto matching template slots
- [ ] Dropped items render inside the slot with correct content
- [ ] Items within a slot can be reordered via drag
- [ ] Items can be removed from a slot
- [ ] All changes persist to Supabase and survive page refresh
- [ ] GSAP pickup and drop animations play during drag interactions
- [ ] State-layer tests pass for add, remove, and reorder operations
