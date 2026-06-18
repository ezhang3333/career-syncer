---
title: "Resume preview & PDF export"
type: enhancement
status: ready-for-agent
slice: AFK
blocked_by: "05-resume-drag-drop"
stories: US2, US3
---

## What To Build

Render a clean, print-ready resume preview from the selected template and items, and export it as a PDF.

End-to-end behavior: user clicks "Preview" on a resume, sees a formatted preview matching the chosen template with all their selected items laid out correctly. Clicking "Export PDF" downloads a PDF of that resume.

- Resume preview page/modal that renders the full resume layout using the template + selected items
- Classic and Modern templates styled for print (proper typography, spacing, sections)
- PDF export via a server-side route (using a headless approach such as Puppeteer or a React-to-PDF library)
- GSAP entrance animation for the preview modal
- Preview accurately reflects the current state of `resume_items` for that resume

## Acceptance Criteria

- [ ] Preview renders all selected items in the correct template layout
- [ ] Classic and Modern templates are visually distinct and print-ready
- [ ] "Export PDF" downloads a correctly formatted PDF
- [ ] PDF content matches what is shown in the preview
- [ ] Preview modal opens with a GSAP entrance animation
- [ ] Exported PDF has no layout overflow or clipping issues
