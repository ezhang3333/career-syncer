"use client";

import { useRef, useState, useCallback } from "react";
import { gsap } from "@/lib/gsap";
import type { TemplateId } from "@/lib/templates";
import { sectionItems } from "./resumeItemsState";
import type { DraftResumeItem } from "./resumeItemsState";
import type { PaletteItem } from "./careerData";

// ---------------------------------------------------------------------------
// HTML preview sections
// ---------------------------------------------------------------------------

function PreviewSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 border-b border-gray-300 pb-0.5 first:mt-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
        {children}
      </p>
    </div>
  );
}

function PreviewItem({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string | null;
}) {
  return (
    <div className="mt-2">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
}

function PreviewSection({
  label,
  items,
  palette,
}: {
  label: string;
  items: DraftResumeItem[];
  palette: PaletteItem[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <PreviewSectionHeading>{label}</PreviewSectionHeading>
      {items.map((item, i) => {
        const match = palette.find(
          (p) => p.entityType === item.entity_type && p.entityId === item.entity_id,
        );
        return (
          <PreviewItem
            key={i}
            title={match?.title ?? "Unknown"}
            subtitle={match?.subtitle ?? null}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HTML resume layouts
// ---------------------------------------------------------------------------

function ClassicPreview({
  items,
  palette,
}: {
  items: DraftResumeItem[];
  palette: PaletteItem[];
}) {
  return (
    <div className="mx-auto w-full max-w-[680px] bg-white p-10 font-serif shadow-sm">
      {/* Header */}
      <div className="mb-4 border-b border-gray-300 pb-4 text-center">
        <p className="text-2xl font-bold text-gray-900">Your Name</p>
        <p className="mt-1 text-xs text-gray-500">email · phone · location</p>
      </div>
      <PreviewSection
        label="Experience"
        items={sectionItems(items, "experience")}
        palette={palette}
      />
      <PreviewSection
        label="Projects"
        items={sectionItems(items, "projects")}
        palette={palette}
      />
      <PreviewSection
        label="Education"
        items={sectionItems(items, "education")}
        palette={palette}
      />
      <PreviewSection
        label="Skills"
        items={sectionItems(items, "skills")}
        palette={palette}
      />
      <PreviewSection
        label="Certifications"
        items={sectionItems(items, "certifications")}
        palette={palette}
      />
    </div>
  );
}

function ModernPreview({
  items,
  palette,
}: {
  items: DraftResumeItem[];
  palette: PaletteItem[];
}) {
  return (
    <div className="mx-auto w-full max-w-[760px] bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-300 p-8 pb-5 text-center">
        <p className="text-2xl font-bold text-gray-900">Your Name</p>
        <p className="mt-1 text-xs text-gray-500">email · phone · location</p>
      </div>
      {/* Two-column body */}
      <div className="flex gap-0">
        {/* Sidebar */}
        <div className="w-[220px] shrink-0 bg-gray-50 p-6">
          <PreviewSection
            label="Skills"
            items={sectionItems(items, "skills")}
            palette={palette}
          />
          <PreviewSection
            label="Education"
            items={sectionItems(items, "education")}
            palette={palette}
          />
          <PreviewSection
            label="Certifications"
            items={sectionItems(items, "certifications")}
            palette={palette}
          />
        </div>
        {/* Main */}
        <div className="flex-1 p-6">
          <PreviewSection
            label="Experience"
            items={sectionItems(items, "experience")}
            palette={palette}
          />
          <PreviewSection
            label="Projects"
            items={sectionItems(items, "projects")}
            palette={palette}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export default function PreviewModal({
  templateId,
  items,
  palette,
  resumeName,
  onClose,
}: {
  templateId: TemplateId;
  items: DraftResumeItem[];
  palette: PaletteItem[];
  resumeName: string;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  // Entrance animation on mount via ref callback.
  const setCardRef = useCallback((el: HTMLDivElement | null) => {
    (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (!el) return;
    gsap.fromTo(
      el,
      { autoAlpha: 0, scale: 0.95 },
      { autoAlpha: 1, scale: 1, duration: 0.3, ease: "power3.out" },
    );
  }, []);

  const setOverlayRef = useCallback((el: HTMLDivElement | null) => {
    (overlayRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (!el) return;
    gsap.fromTo(
      el,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.2, ease: "power2.out" },
    );
  }, []);

  const handleClose = useCallback(() => {
    const card = cardRef.current;
    const overlay = overlayRef.current;
    if (card) {
      gsap.to(card, {
        autoAlpha: 0,
        scale: 0.95,
        duration: 0.22,
        ease: "power2.in",
        onComplete: onClose,
      });
    } else {
      onClose();
    }
    if (overlay) {
      gsap.to(overlay, { autoAlpha: 0, duration: 0.22, ease: "power2.in" });
    }
  }, [onClose]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      // Dynamic import keeps @react-pdf/renderer out of the SSR bundle.
      const { pdf } = await import("@react-pdf/renderer");
      const { ClassicPDF, ModernPDF } = await import("./ResumePDF");

      const doc =
        templateId === "modern" ? (
          <ModernPDF items={items} palette={palette} resumeName={resumeName} />
        ) : (
          <ClassicPDF items={items} palette={palette} resumeName={resumeName} />
        );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resumeName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [templateId, items, palette, resumeName]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-6">
      <div
        ref={setOverlayRef}
        className="fixed inset-0 bg-black/70"
        onClick={handleClose}
      />
      <div
        ref={setCardRef}
        className="relative z-10 my-6 w-full max-w-4xl rounded-xl border border-white/10 bg-[#111113] shadow-2xl"
      >
        {/* Modal toolbar */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <p className="text-sm font-medium text-white/70">{resumeName}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-white/90 disabled:opacity-50 transition-colors"
            >
              {exporting ? "Exporting…" : "Export PDF"}
            </button>
            <button
              onClick={handleClose}
              className="rounded p-1 text-white/40 hover:text-white transition-colors"
              aria-label="Close preview"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Preview body */}
        <div className="overflow-y-auto p-6">
          {templateId === "modern" ? (
            <ModernPreview items={items} palette={palette} />
          ) : (
            <ClassicPreview items={items} palette={palette} />
          )}
        </div>
      </div>
    </div>
  );
}
