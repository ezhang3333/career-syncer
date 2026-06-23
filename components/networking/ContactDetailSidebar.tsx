"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Contact } from "@/lib/types/database";

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-white/40">{label}</span>
      <span className="text-sm text-white/90">{value}</span>
    </div>
  );
}

export default function ContactDetailSidebar({
  contact,
  onClose,
}: {
  contact: Contact | null;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);

  // Slide in from the right whenever a contact is set.
  useGSAP(
    () => {
      if (contact && panel.current) {
        gsap.fromTo(
          panel.current,
          { x: 300, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, ease: "power2.out" },
        );
      }
    },
    { dependencies: [contact?.id] },
  );

  if (!contact) return null;

  return (
    <>
      {/* Click-away backdrop */}
      <div
        className="absolute inset-0 z-10 bg-black/30"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        ref={panel}
        className="absolute right-0 top-0 z-20 flex h-full w-80 max-w-[90%] flex-col gap-5 overflow-y-auto border-l border-white/10 bg-neutral-950/95 p-5 backdrop-blur"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold tracking-tight">{contact.name}</h2>
            {(contact.role || contact.company) && (
              <span className="text-sm text-white/60">
                {[contact.role, contact.company].filter(Boolean).join(" @ ")}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md border border-white/10 px-2 py-1 text-xs text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>

        {contact.category && (
          <span className="w-fit rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs text-white/60">
            {contact.category}
          </span>
        )}

        <div className="flex flex-col gap-4">
          <Field label="How we met" value={contact.how_met} />
          <Field label="Notes" value={contact.notes} />
          <Field
            label="Last contacted"
            value={contact.last_contacted ? formatDate(contact.last_contacted) : null}
          />
          {contact.linkedin_url && (
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-white/40">
                LinkedIn
              </span>
              <a
                href={contact.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sm text-blue-400 hover:underline"
              >
                {contact.linkedin_url}
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
