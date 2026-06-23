"use client";

import { useRef, useState, useCallback } from "react";
import { gsap } from "@/lib/gsap";
import type { Contact } from "@/lib/types/database";

type MessageType = "cold" | "followup" | "linkedin-dm" | "thank-you";

const MESSAGE_TYPES: { value: MessageType; label: string }[] = [
  { value: "cold", label: "Cold Outreach" },
  { value: "followup", label: "Follow-Up" },
  { value: "linkedin-dm", label: "LinkedIn DM" },
  { value: "thank-you", label: "Thank You" },
];

interface DraftOutreachModalProps {
  contact: Contact | null;
  onClose: () => void;
}

export default function DraftOutreachModal({
  contact,
  onClose,
}: DraftOutreachModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [selectedType, setSelectedType] = useState<MessageType>("cold");
  const [draft, setDraft] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Entrance animation via ref callback
  const setModalRef = useCallback((el: HTMLDivElement | null) => {
    (modalRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (!el) return;
    gsap.from(el, { y: 40, opacity: 0, duration: 0.35, ease: "power2.out" });
  }, []);

  const setOverlayRef = useCallback((el: HTMLDivElement | null) => {
    (overlayRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (!el) return;
    gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: "power2.out" });
  }, []);

  const handleClose = useCallback(() => {
    const modal = modalRef.current;
    const overlay = overlayRef.current;
    if (modal) {
      gsap.to(modal, {
        y: 40,
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
        onComplete: onClose,
      });
    } else {
      onClose();
    }
    if (overlay) {
      gsap.to(overlay, { autoAlpha: 0, duration: 0.25, ease: "power2.in" });
    }
  }, [onClose]);

  async function handleGenerate() {
    if (!contact) return;
    setLoading(true);
    setError(null);
    setDraft("");
    setCopied(false);

    try {
      const res = await fetch(`/api/contacts/${contact.id}/draft-outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageType: selectedType }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate draft");
        return;
      }
      setDraft(data.draft ?? "");
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!contact) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        ref={setOverlayRef}
        className="fixed inset-0 bg-black/70"
        onClick={handleClose}
      />

      {/* Modal card */}
      <div
        ref={setModalRef}
        className="relative z-10 flex w-full max-w-lg flex-col gap-5 rounded-xl border border-white/10 bg-[#111113] p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">Draft Outreach</h2>
            <p className="mt-0.5 text-sm text-white/50">
              {contact.name}
              {contact.company ? ` · ${contact.company}` : ""}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded p-1 text-white/40 transition-colors hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Message type picker */}
        <div className="flex flex-wrap gap-2">
          {MESSAGE_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSelectedType(value)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedType === value
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate"}
        </button>

        {/* Error state */}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* Draft display */}
        {draft && (
          <div className="flex flex-col gap-2">
            <textarea
              readOnly
              value={draft}
              rows={10}
              className="w-full resize-none rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
            <button
              onClick={handleCopy}
              className="self-end rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/60 transition-colors hover:border-white/20 hover:text-white"
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
