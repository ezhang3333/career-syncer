---
title: "Three.js cluster visualization for networking"
type: enhancement
status: ready-for-agent
slice: Phase 3
blocked_by: "networking CRM (Phase 2 — complete)"
stories: US10
---

## What To Build

Implement an interactive Three.js cluster visualization of the user's professional network, grouped hierarchically: category → company → person. Users can explore connections spatially with expand/collapse interactions. This lives alongside (or replaces the view toggle for) the existing networking list view.

End-to-end behavior: user visits `/networking` and switches to the visualization tab. A 3D cluster of nodes renders, with the top-level nodes being categories (Tech, Finance, Government, etc.). Clicking a category expands it to show company nodes underneath. Clicking a company expands it to show individual contact nodes. Clicking a contact node opens a sidebar/drawer with their CRM details. GSAP drives the expand/collapse transition easing.

### What to build
- Three.js canvas component at `components/networking/ClusterViz.tsx`
  - Category nodes at outermost level
  - Company nodes nested under each category
  - Contact nodes nested under each company (loaded from contacts API)
  - Node labels rendered via Three.js `TextGeometry` or CSS2DRenderer
- Expand/collapse interaction on node click (animate child nodes into/out of view)
- GSAP tweens drive the position/scale animations on expand/collapse (integrate with Three.js tick loop)
- Contact detail drawer/sidebar that opens when a contact node is clicked (shows CRM fields)
- View toggle on `/networking`: "List" | "Visualization" (existing list view is preserved)
- The viz loads contacts from the existing `GET /api/contacts` endpoint — no new API routes needed
- Orbit controls (via `three/examples/jsm/controls/OrbitControls`) for pan/zoom/rotate

### Animation notes (12 principles)
- Expand: child nodes scale up from 0 with ease-out + slight overshoot (anticipation)
- Collapse: child nodes scale down and move toward parent with ease-in
- Hover: node scales up slightly with squash/stretch feel

## Acceptance Criteria

- [ ] Three.js canvas renders on `/networking` in the visualization tab
- [ ] Category, company, and contact nodes are visually distinct (size, color, label)
- [ ] Clicking a category node expands to reveal company nodes
- [ ] Clicking a company node expands to reveal contact nodes
- [ ] Clicking a contact node opens a sidebar with that contact's CRM details
- [ ] Expand/collapse transitions use GSAP easing (not raw Three.js)
- [ ] Orbit controls work: user can pan, zoom, and rotate the cluster
- [ ] View toggle between List and Visualization preserves existing list view
- [ ] Visualization reads from existing contacts API — no duplicate data fetching logic
