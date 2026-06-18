// Pure state-layer logic for resume item assignment.
// No DOM, no network — just transformations over the in-memory list of items.

import type { EntityType, ResumeItem } from "@/lib/types/database";

// Items held in client state before/while they are persisted have an optional
// id (server assigns the real uuid on POST). Everything else mirrors ResumeItem.
export type DraftResumeItem = Omit<ResumeItem, "id" | "created_at"> & {
  id?: string;
};

export function isDuplicate(
  items: DraftResumeItem[],
  entityType: EntityType,
  entityId: string,
  section: string,
): boolean {
  return items.some(
    (item) =>
      item.entity_type === entityType &&
      item.entity_id === entityId &&
      item.section === section,
  );
}

// Append an item to the end of its section. Rejects duplicates (same entity in
// the same section) by returning the unchanged list.
export function addItem(
  items: DraftResumeItem[],
  resumeId: string,
  entityType: EntityType,
  entityId: string,
  section: string,
): DraftResumeItem[] {
  if (isDuplicate(items, entityType, entityId, section)) return items;

  const position = items.filter((item) => item.section === section).length;
  return [
    ...items,
    {
      resume_id: resumeId,
      entity_type: entityType,
      entity_id: entityId,
      section,
      position,
    },
  ];
}

// Remove an item by its key (entity + section) and renumber its section so
// positions stay contiguous (0..n-1).
export function removeItem(
  items: DraftResumeItem[],
  entityType: EntityType,
  entityId: string,
  section: string,
): DraftResumeItem[] {
  const remaining = items.filter(
    (item) =>
      !(
        item.entity_type === entityType &&
        item.entity_id === entityId &&
        item.section === section
      ),
  );
  return renumberSection(remaining, section);
}

// Move an item within its section from index `from` to index `to`, then
// renumber that section's positions.
export function reorderItem(
  items: DraftResumeItem[],
  section: string,
  from: number,
  to: number,
): DraftResumeItem[] {
  const sectionItems = items
    .filter((item) => item.section === section)
    .sort((a, b) => a.position - b.position);

  if (
    from < 0 ||
    to < 0 ||
    from >= sectionItems.length ||
    to >= sectionItems.length
  ) {
    return items;
  }

  const [moved] = sectionItems.splice(from, 1);
  sectionItems.splice(to, 0, moved);

  const reindexed = sectionItems.map((item, index) => ({
    ...item,
    position: index,
  }));
  const others = items.filter((item) => item.section !== section);
  return [...others, ...reindexed];
}

function renumberSection(
  items: DraftResumeItem[],
  section: string,
): DraftResumeItem[] {
  const sectionItems = items
    .filter((item) => item.section === section)
    .sort((a, b) => a.position - b.position)
    .map((item, index) => ({ ...item, position: index }));
  const others = items.filter((item) => item.section !== section);
  return [...others, ...sectionItems];
}

export function sectionItems(
  items: DraftResumeItem[],
  section: string,
): DraftResumeItem[] {
  return items
    .filter((item) => item.section === section)
    .sort((a, b) => a.position - b.position);
}
