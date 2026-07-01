"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { gsap, useGSAP } from "@/lib/gsap";
import {
  TEMPLATES,
  TemplateThumbnail,
  templateName,
  type TemplateId,
} from "@/lib/templates";
import type { Resume } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Template picker modal
// ---------------------------------------------------------------------------

function TemplatePicker({
  onClose,
  onCreate,
  creating,
}: {
  onClose: () => void;
  onCreate: (name: string, templateId: TemplateId) => void;
  creating: boolean;
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<TemplateId>("classic");
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (overlayRef.current) {
      gsap.fromTo(
        overlayRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.2, ease: "power2.out" },
      );
    }
    const cards = cardsRef.current?.querySelectorAll("[data-card]");
    if (cards && cards.length) {
      gsap.fromTo(
        cards,
        { autoAlpha: 0, y: 16 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.35,
          stagger: 0.08,
          ease: "power3.out",
        },
      );
    }
  }, []);

  // Scale the selected card slightly.
  useEffect(() => {
    const cards = cardsRef.current?.querySelectorAll<HTMLElement>("[data-card]");
    cards?.forEach((card) => {
      gsap.to(card, {
        scale: card.dataset.id === selected ? 1.03 : 1,
        duration: 0.25,
        ease: "power2.out",
      });
    });
  }, [selected]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl rounded-xl border border-white/10 bg-[#111113] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold">New Resume</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-white/40 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mb-5">
          <label className="mb-1 block text-xs font-medium text-white/50">
            Resume Name *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Software Engineer — 2026"
            autoFocus
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30"
          />
        </div>

        <label className="mb-2 block text-xs font-medium text-white/50">
          Template
        </label>
        <div ref={cardsRef} className="grid grid-cols-2 gap-4">
          {(Object.keys(TEMPLATES) as TemplateId[]).map((id) => {
            const t = TEMPLATES[id];
            const active = selected === id;
            return (
              <button
                key={id}
                data-card
                data-id={id}
                onClick={() => setSelected(id)}
                className={`flex flex-col gap-3 rounded-lg border p-3 text-left transition-colors ${
                  active
                    ? "border-white/40 bg-white/[0.06]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <div className="aspect-[3/4] w-full overflow-hidden rounded bg-[#0a0a0b]">
                  <TemplateThumbnail id={id} />
                </div>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="mt-0.5 text-xs text-white/40">
                    {t.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(name.trim(), selected)}
            disabled={!name.trim() || creating}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-50 transition-colors"
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Resume card
// ---------------------------------------------------------------------------

function ResumeCard({
  resume,
  onOpen,
  onDelete,
}: {
  resume: Resume;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] transition-colors hover:border-white/20">
      <button
        onClick={onOpen}
        className="aspect-[3/4] w-full overflow-hidden bg-[#0a0a0b] text-left"
      >
        <TemplateThumbnail id={resume.template_id as TemplateId} />
      </button>
      <div className="flex items-start justify-between gap-2 border-t border-white/10 p-3">
        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium">{resume.name}</p>
          <p className="text-xs text-white/40">
            {templateName(resume.template_id)}
          </p>
        </button>
        {confirming ? (
          <div className="flex shrink-0 items-center gap-1.5 text-xs">
            <button
              onClick={onDelete}
              className="rounded bg-red-500/20 px-2 py-0.5 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded bg-white/5 px-2 py-0.5 text-white/60 hover:bg-white/10 transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="shrink-0 rounded px-2 py-1 text-xs text-white/40 hover:bg-red-500/5 hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ResumesPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [creating, setCreating] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/resumes");
    const data = await res.json();
    setResumes(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; project doesn't use React Compiler
    load();
  }, [load]);

  useGSAP(
    () => {
      const cards = gridRef.current?.querySelectorAll("[data-resume]");
      if (!cards || cards.length === 0) return;
      gsap.fromTo(
        cards,
        { autoAlpha: 0, y: 12 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.35,
          stagger: 0.06,
          ease: "power2.out",
        },
      );
    },
    { scope: gridRef, dependencies: [resumes] },
  );

  const handleCreate = async (name: string, templateId: TemplateId) => {
    setCreating(true);
    const res = await fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, template_id: templateId }),
    });
    setCreating(false);
    if (!res.ok) return;
    const resume: Resume = await res.json();
    router.push(`/resumes/${resume.id}`);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/resumes/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Resumes</h1>
        <button
          onClick={() => setPicking(true)}
          className="flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 transition-colors"
        >
          <span className="text-base leading-none">+</span>
          New Resume
        </button>
      </div>

      <div className="mt-8 flex-1">
        {loading ? (
          <p className="text-sm text-white/30">Loading…</p>
        ) : resumes.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-white/10">
            <p className="text-sm text-white/30">
              No resumes yet. Create your first one.
            </p>
          </div>
        ) : (
          <div
            ref={gridRef}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          >
            {resumes.map((r) => (
              <div key={r.id} data-resume>
                <ResumeCard
                  resume={r}
                  onOpen={() => router.push(`/resumes/${r.id}`)}
                  onDelete={() => handleDelete(r.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {picking && (
        <TemplatePicker
          onClose={() => setPicking(false)}
          onCreate={handleCreate}
          creating={creating}
        />
      )}
    </div>
  );
}
