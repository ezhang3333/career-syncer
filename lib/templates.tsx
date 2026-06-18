// Shared template metadata for resume creation and rendering.
// Slots are visual-only placeholders for now; drag-and-drop wiring is issue #5.

export type TemplateId = "classic" | "modern";

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  description: string;
}

export const TEMPLATES: Record<TemplateId, TemplateMeta> = {
  classic: {
    id: "classic",
    name: "Classic",
    description: "Traditional single-column layout with a serif feel.",
  },
  modern: {
    id: "modern",
    name: "Modern",
    description: "Two-column layout with a sidebar for skills and education.",
  },
};

export function templateName(id: string): string {
  return id === "classic" || id === "modern" ? TEMPLATES[id].name : id;
}

// ---------------------------------------------------------------------------
// Thumbnail mockups — abstract layout lines only, no real data.
// ---------------------------------------------------------------------------

const line = "rounded-full bg-white/15";

export function ClassicThumbnail() {
  return (
    <div className="flex h-full w-full flex-col gap-2 p-3">
      <div className={`${line} mx-auto h-2 w-1/2`} />
      <div className={`${line} mx-auto mb-1 h-1 w-1/3`} />
      <div className="h-px w-full bg-white/10" />
      <div className={`${line} h-1.5 w-1/4`} />
      <div className={`${line} h-1 w-full`} />
      <div className={`${line} h-1 w-5/6`} />
      <div className={`${line} mt-1 h-1.5 w-1/4`} />
      <div className={`${line} h-1 w-full`} />
      <div className={`${line} h-1 w-4/6`} />
    </div>
  );
}

export function ModernThumbnail() {
  return (
    <div className="flex h-full w-full gap-2 p-3">
      <div className="flex w-1/3 flex-col gap-1.5 rounded bg-white/[0.06] p-2">
        <div className={`${line} h-1.5 w-2/3`} />
        <div className={`${line} h-1 w-full`} />
        <div className={`${line} h-1 w-5/6`} />
        <div className={`${line} mt-1 h-1.5 w-2/3`} />
        <div className={`${line} h-1 w-full`} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className={`${line} h-2 w-1/2`} />
        <div className={`${line} mb-1 h-1 w-1/3`} />
        <div className={`${line} h-1.5 w-1/3`} />
        <div className={`${line} h-1 w-full`} />
        <div className={`${line} h-1 w-5/6`} />
      </div>
    </div>
  );
}

export function TemplateThumbnail({ id }: { id: TemplateId }) {
  return id === "classic" ? <ClassicThumbnail /> : <ModernThumbnail />;
}
