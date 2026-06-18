"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap, useGSAP } from "@/lib/gsap";
import type { TemplateId } from "@/lib/templates";
import type { EntityType, ResumeItem } from "@/lib/types/database";
import {
  ENTITY_TYPES,
  ENTITY_CONFIG,
  fetchPaletteItems,
  paletteKey,
  type PaletteItem,
  type SectionId,
} from "./careerData";
import {
  addItem,
  removeItem,
  reorderItem,
  isDuplicate,
  sectionItems,
  type DraftResumeItem,
} from "./resumeItemsState";

const PreviewModal = dynamic(() => import("./PreviewModal"), { ssr: false });

const SECTION_META: Record<SectionId, { label: string; hint: string }> = {
  experience: { label: "Experience", hint: "Drop work experiences here" },
  projects: { label: "Projects", hint: "Drop projects here" },
  education: { label: "Education", hint: "Drop education here" },
  skills: { label: "Skills", hint: "Drop skills here" },
  certifications: { label: "Certifications", hint: "Drop certifications here" },
};

// What gets carried during an HTML5 drag.
type DragPayload =
  | { kind: "palette"; item: PaletteItem }
  | { kind: "reorder"; section: SectionId; index: number };

export default function ResumeEditor({
  resumeId,
  resumeName,
  templateId,
}: {
  resumeId: string;
  resumeName: string;
  templateId: TemplateId;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [palette, setPalette] = useState<PaletteItem[]>([]);
  const [items, setItems] = useState<DraftResumeItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const dragRef = useRef<DragPayload | null>(null);
  const [dragOverSection, setDragOverSection] = useState<SectionId | null>(null);

  // Load palette + saved selections.
  useEffect(() => {
    let active = true;
    (async () => {
      const [paletteItems, savedRes] = await Promise.all([
        fetchPaletteItems(),
        fetch(`/api/resumes/${resumeId}/items`),
      ]);
      if (!active) return;
      setPalette(paletteItems);
      if (savedRes.ok) {
        const saved = (await savedRes.json()) as ResumeItem[];
        if (active) setItems(saved);
      }
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [resumeId]);

  const lookupPalette = useCallback(
    (entityType: EntityType, entityId: string) =>
      palette.find(
        (p) => p.entityType === entityType && p.entityId === entityId,
      ),
    [palette],
  );

  // --- Persistence helpers -------------------------------------------------

  const persistAdd = useCallback(
    async (item: DraftResumeItem) => {
      const res = await fetch(`/api/resumes/${resumeId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: item.entity_type,
          entity_id: item.entity_id,
          section: item.section,
          position: item.position,
        }),
      });
      if (!res.ok) return;
      const saved = (await res.json()) as ResumeItem;
      // Attach the server id to the matching draft item.
      setItems((prev) =>
        prev.map((p) =>
          p.id === undefined &&
          p.entity_type === item.entity_type &&
          p.entity_id === item.entity_id &&
          p.section === item.section
            ? { ...p, id: saved.id }
            : p,
        ),
      );
    },
    [resumeId],
  );

  const persistRemove = useCallback(
    async (id: string | undefined) => {
      if (!id) return;
      await fetch(`/api/resumes/${resumeId}/items/${id}`, { method: "DELETE" });
    },
    [resumeId],
  );

  const persistPositions = useCallback(
    async (sectionList: DraftResumeItem[]) => {
      await Promise.all(
        sectionList
          .filter((item) => item.id)
          .map((item) =>
            fetch(`/api/resumes/${resumeId}/items/${item.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ position: item.position }),
            }),
          ),
      );
    },
    [resumeId],
  );

  // --- State operations ----------------------------------------------------

  const handleAdd = useCallback(
    (paletteItem: PaletteItem, section: SectionId) => {
      setItems((prev) => {
        if (
          isDuplicate(prev, paletteItem.entityType, paletteItem.entityId, section)
        ) {
          return prev;
        }
        const next = addItem(
          prev,
          resumeId,
          paletteItem.entityType,
          paletteItem.entityId,
          section,
        );
        const added = next[next.length - 1];
        void persistAdd(added);
        return next;
      });
    },
    [resumeId, persistAdd],
  );

  const handleRemove = useCallback(
    (item: DraftResumeItem) => {
      void persistRemove(item.id);
      setItems((prev) => {
        const next = removeItem(
          prev,
          item.entity_type,
          item.entity_id,
          item.section,
        );
        void persistPositions(sectionItems(next, item.section));
        return next;
      });
    },
    [persistRemove, persistPositions],
  );

  const handleReorder = useCallback(
    (section: SectionId, from: number, to: number) => {
      if (from === to) return;
      setItems((prev) => {
        const next = reorderItem(prev, section, from, to);
        if (next !== prev) void persistPositions(sectionItems(next, section));
        return next;
      });
    },
    [persistPositions],
  );

  // --- Drag handlers -------------------------------------------------------

  const onDropInSection = useCallback(
    (section: SectionId) => {
      const payload = dragRef.current;
      dragRef.current = null;
      setDragOverSection(null);
      if (!payload) return;
      if (payload.kind === "palette") {
        if (payload.item.section !== section) return; // type must match section
        handleAdd(payload.item, section);
      }
    },
    [handleAdd],
  );

  return (
    <>
      <div ref={container} className="flex flex-1 gap-4 overflow-hidden">
        <Palette
          palette={palette}
          items={items}
          dragRef={dragRef}
          loaded={loaded}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="mb-3 flex justify-end">
            <button
              onClick={() => setPreviewing(true)}
              className="rounded-md border border-white/15 bg-white/[0.04] px-4 py-1.5 text-sm text-white/70 hover:border-white/30 hover:text-white transition-colors"
            >
              Preview
            </button>
          </div>

          <div className="flex-1 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.01] p-6">
            {templateId === "modern" ? (
              <ModernLayout
                items={items}
                lookupPalette={lookupPalette}
                dragRef={dragRef}
                dragOverSection={dragOverSection}
                setDragOverSection={setDragOverSection}
                onDropInSection={onDropInSection}
                onRemove={handleRemove}
                onReorder={handleReorder}
              />
            ) : (
              <ClassicLayout
                items={items}
                lookupPalette={lookupPalette}
                dragRef={dragRef}
                dragOverSection={dragOverSection}
                setDragOverSection={setDragOverSection}
                onDropInSection={onDropInSection}
                onRemove={handleRemove}
                onReorder={handleReorder}
              />
            )}
          </div>
        </div>
      </div>

      {previewing && (
        <PreviewModal
          templateId={templateId}
          items={items}
          palette={palette}
          resumeName={resumeName}
          onClose={() => setPreviewing(false)}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

function Palette({
  palette,
  items,
  dragRef,
  loaded,
}: {
  palette: PaletteItem[];
  items: DraftResumeItem[];
  dragRef: React.RefObject<DragPayload | null>;
  loaded: boolean;
}) {
  const isUsed = (p: PaletteItem) =>
    isDuplicate(items, p.entityType, p.entityId, p.section);

  return (
    <aside className="w-64 shrink-0 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.01] p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-white/40">
        Your Items
      </p>
      {!loaded && <p className="text-xs text-white/30">Loading…</p>}
      {loaded && palette.length === 0 && (
        <p className="text-xs text-white/30">
          No career data yet. Add some first.
        </p>
      )}
      <div className="flex flex-col gap-4">
        {ENTITY_TYPES.map((entityType) => {
          const group = palette.filter((p) => p.entityType === entityType);
          if (group.length === 0) return null;
          return (
            <div key={entityType}>
              <p className="mb-1.5 text-[11px] font-medium text-white/30">
                {ENTITY_CONFIG[entityType].badge}
              </p>
              <div className="flex flex-col gap-1.5">
                {group.map((p) => {
                  const used = isUsed(p);
                  return (
                    <div
                      key={paletteKey(p.entityType, p.entityId)}
                      draggable={!used}
                      onDragStart={() => {
                        dragRef.current = { kind: "palette", item: p };
                      }}
                      className={`cursor-grab rounded-md border px-3 py-2 text-left transition-colors ${
                        used
                          ? "cursor-not-allowed border-white/5 bg-white/[0.01] opacity-40"
                          : "border-white/10 bg-white/[0.03] hover:border-white/25"
                      }`}
                    >
                      <p className="truncate text-sm text-white/80">{p.title}</p>
                      {p.subtitle && (
                        <p className="truncate text-xs text-white/40">
                          {p.subtitle}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Canvas slots
// ---------------------------------------------------------------------------

interface SlotProps {
  items: DraftResumeItem[];
  lookupPalette: (
    entityType: EntityType,
    entityId: string,
  ) => PaletteItem | undefined;
  dragRef: React.RefObject<DragPayload | null>;
  dragOverSection: SectionId | null;
  setDragOverSection: (s: SectionId | null) => void;
  onDropInSection: (section: SectionId) => void;
  onRemove: (item: DraftResumeItem) => void;
  onReorder: (section: SectionId, from: number, to: number) => void;
}

function Header() {
  return (
    <div
      data-slot
      className="rounded-md border border-dashed border-white/15 bg-white/[0.02] px-4 py-5 text-center"
    >
      <p className="text-sm font-medium text-white/60">Header</p>
      <p className="text-xs text-white/30">Name and contact info</p>
    </div>
  );
}

function Slot({
  section,
  items,
  lookupPalette,
  dragRef,
  dragOverSection,
  setDragOverSection,
  onDropInSection,
  onRemove,
  onReorder,
}: SlotProps & { section: SectionId }) {
  const meta = SECTION_META[section];
  const list = sectionItems(items, section);
  const isOver = dragOverSection === section;
  const listRef = useRef<HTMLDivElement>(null);

  // Animate items into place when the list changes (drop / reorder).
  useGSAP(
    () => {
      const els = listRef.current?.querySelectorAll("[data-item]");
      if (!els || els.length === 0) return;
      gsap.fromTo(
        els,
        { scale: 0.92, autoAlpha: 0.4, y: 6 },
        {
          scale: 1,
          autoAlpha: 1,
          y: 0,
          duration: 0.35,
          ease: "back.out(2)",
          stagger: 0.04,
        },
      );
    },
    { scope: listRef, dependencies: [list.length] },
  );

  return (
    <div
      data-slot
      onDragOver={(e) => {
        e.preventDefault();
        const payload = dragRef.current;
        // Only show "drop here" if a matching palette item is being dragged.
        if (payload?.kind === "palette" && payload.item.section === section) {
          setDragOverSection(section);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        if (dragOverSection === section) setDragOverSection(null);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDropInSection(section);
      }}
      className={`flex min-h-24 flex-col gap-2 rounded-md border px-4 py-4 transition-colors ${
        isOver
          ? "border-solid border-emerald-400/60 bg-emerald-400/[0.06]"
          : "border-dashed border-white/15 bg-white/[0.02]"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-white/40">
        {meta.label}
      </p>

      {list.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-xs text-white/30">
          {meta.hint}
        </p>
      ) : (
        <div ref={listRef} className="flex flex-col gap-2">
          {list.map((item, index) => {
            const data = lookupPalette(item.entity_type, item.entity_id);
            return (
              <SlotItem
                key={`${item.entity_type}:${item.entity_id}`}
                index={index}
                section={section}
                title={data?.title ?? "Unknown item"}
                subtitle={data?.subtitle ?? null}
                dragRef={dragRef}
                onReorder={onReorder}
                onRemove={() => onRemove(item)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function SlotItem({
  index,
  section,
  title,
  subtitle,
  dragRef,
  onReorder,
  onRemove,
}: {
  index: number;
  section: SectionId;
  title: string;
  subtitle: string | null;
  dragRef: React.RefObject<DragPayload | null>;
  onReorder: (section: SectionId, from: number, to: number) => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);

  const handleRemove = () => {
    const el = ref.current;
    if (!el) return onRemove();
    gsap.to(el, {
      scale: 0.85,
      autoAlpha: 0,
      duration: 0.22,
      ease: "power2.in",
      onComplete: onRemove,
    });
  };

  return (
    <div
      ref={ref}
      data-item
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        dragRef.current = { kind: "reorder", section, index };
        gsap.to(ref.current, {
          scale: 1.03,
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          duration: 0.18,
          ease: "power2.out",
        });
      }}
      onDragEnd={() => {
        gsap.to(ref.current, {
          scale: 1,
          boxShadow: "0 0px 0px rgba(0,0,0,0)",
          duration: 0.2,
        });
      }}
      onDragOver={(e) => {
        const payload = dragRef.current;
        if (payload?.kind === "reorder" && payload.section === section) {
          e.preventDefault();
          e.stopPropagation();
          setOver(true);
        }
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        const payload = dragRef.current;
        if (payload?.kind === "reorder" && payload.section === section) {
          e.preventDefault();
          e.stopPropagation();
          setOver(false);
          onReorder(section, payload.index, index);
          dragRef.current = null;
        }
      }}
      className={`group flex items-center gap-2 rounded-md border bg-white/[0.04] px-3 py-2 ${
        over ? "border-emerald-400/60" : "border-white/10"
      }`}
    >
      <span className="cursor-grab select-none text-white/25" aria-hidden>
        ⠿
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-white/85">{title}</p>
        {subtitle && (
          <p className="truncate text-xs text-white/40">{subtitle}</p>
        )}
      </div>
      <button
        type="button"
        onClick={handleRemove}
        aria-label="Remove item"
        className="text-white/30 opacity-0 transition-opacity hover:text-white/70 group-hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}

function ClassicLayout(props: SlotProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 font-serif">
      <Header />
      <Slot section="experience" {...props} />
      <Slot section="projects" {...props} />
      <Slot section="education" {...props} />
      <Slot section="skills" {...props} />
      <Slot section="certifications" {...props} />
    </div>
  );
}

function ModernLayout(props: SlotProps) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <Header />
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1 flex flex-col gap-4">
          <Slot section="skills" {...props} />
          <Slot section="education" {...props} />
          <Slot section="certifications" {...props} />
        </div>
        <div className="col-span-2 flex flex-col gap-4">
          <Slot section="experience" {...props} />
          <Slot section="projects" {...props} />
        </div>
      </div>
    </div>
  );
}
