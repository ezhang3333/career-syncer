import {
  addItem,
  removeItem,
  reorderItem,
  isDuplicate,
  sectionItems,
  type DraftResumeItem,
} from "@/app/resumes/[id]/resumeItemsState";

const RESUME_ID = "resume-1";

describe("addItem", () => {
  it("produces a correctly shaped resume_item appended to the section", () => {
    const result = addItem([], RESUME_ID, "work_experience", "we-1", "experience");

    expect(result).toEqual([
      {
        resume_id: RESUME_ID,
        entity_type: "work_experience",
        entity_id: "we-1",
        section: "experience",
        position: 0,
      },
    ]);
  });

  it("assigns increasing positions within the same section", () => {
    let items: DraftResumeItem[] = [];
    items = addItem(items, RESUME_ID, "work_experience", "we-1", "experience");
    items = addItem(items, RESUME_ID, "work_experience", "we-2", "experience");

    expect(items.map((i) => i.position)).toEqual([0, 1]);
  });

  it("tracks positions per-section independently", () => {
    let items: DraftResumeItem[] = [];
    items = addItem(items, RESUME_ID, "work_experience", "we-1", "experience");
    items = addItem(items, RESUME_ID, "skill", "sk-1", "skills");

    expect(sectionItems(items, "experience")[0].position).toBe(0);
    expect(sectionItems(items, "skills")[0].position).toBe(0);
  });

  it("rejects a duplicate item in the same section", () => {
    let items: DraftResumeItem[] = [];
    items = addItem(items, RESUME_ID, "project", "p-1", "projects");
    const after = addItem(items, RESUME_ID, "project", "p-1", "projects");

    expect(after).toBe(items);
    expect(after).toHaveLength(1);
  });

  it("allows the same entity in a different section", () => {
    let items: DraftResumeItem[] = [];
    items = addItem(items, RESUME_ID, "skill", "sk-1", "skills");
    items = addItem(items, RESUME_ID, "skill", "sk-1", "experience");

    expect(items).toHaveLength(2);
  });
});

describe("isDuplicate", () => {
  it("returns true only when entity and section both match", () => {
    const items = addItem([], RESUME_ID, "project", "p-1", "projects");

    expect(isDuplicate(items, "project", "p-1", "projects")).toBe(true);
    expect(isDuplicate(items, "project", "p-1", "experience")).toBe(false);
    expect(isDuplicate(items, "project", "p-2", "projects")).toBe(false);
  });
});

describe("removeItem", () => {
  it("removes the item from state", () => {
    let items: DraftResumeItem[] = [];
    items = addItem(items, RESUME_ID, "project", "p-1", "projects");
    items = addItem(items, RESUME_ID, "project", "p-2", "projects");

    const after = removeItem(items, "project", "p-1", "projects");

    expect(after.map((i) => i.entity_id)).toEqual(["p-2"]);
  });

  it("renumbers remaining positions contiguously", () => {
    let items: DraftResumeItem[] = [];
    items = addItem(items, RESUME_ID, "project", "p-1", "projects");
    items = addItem(items, RESUME_ID, "project", "p-2", "projects");
    items = addItem(items, RESUME_ID, "project", "p-3", "projects");

    const after = removeItem(items, "project", "p-2", "projects");
    const ordered = sectionItems(after, "projects");

    expect(ordered.map((i) => i.entity_id)).toEqual(["p-1", "p-3"]);
    expect(ordered.map((i) => i.position)).toEqual([0, 1]);
  });
});

describe("reorderItem", () => {
  it("updates positions to reflect the new order", () => {
    let items: DraftResumeItem[] = [];
    items = addItem(items, RESUME_ID, "skill", "a", "skills");
    items = addItem(items, RESUME_ID, "skill", "b", "skills");
    items = addItem(items, RESUME_ID, "skill", "c", "skills");

    // move "c" (index 2) to the front (index 0)
    const after = reorderItem(items, "skills", 2, 0);
    const ordered = sectionItems(after, "skills");

    expect(ordered.map((i) => i.entity_id)).toEqual(["c", "a", "b"]);
    expect(ordered.map((i) => i.position)).toEqual([0, 1, 2]);
  });

  it("leaves the list unchanged for out-of-range indices", () => {
    let items: DraftResumeItem[] = [];
    items = addItem(items, RESUME_ID, "skill", "a", "skills");

    expect(reorderItem(items, "skills", 0, 5)).toBe(items);
  });
});
