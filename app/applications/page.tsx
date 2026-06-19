"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Contact, JobApplication } from "@/lib/types/database";

const COLUMNS = [
  "Wishlist",
  "Applied",
  "Phone Screen",
  "Interview",
  "Offer",
  "Rejected",
  "Archived",
] as const;

type Status = (typeof COLUMNS)[number];

interface AddFormState {
  company: string;
  role: string;
  applied_at: string;
  url: string;
  notes: string;
}

const emptyForm = (): AddFormState => ({
  company: "",
  role: "",
  applied_at: "",
  url: "",
  notes: "",
});

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);

  // Add form: keyed by column status, null = closed
  const [addingIn, setAddingIn] = useState<Status | null>(null);
  const [addForm, setAddForm] = useState<AddFormState>(emptyForm());
  const [addError, setAddError] = useState<string | null>(null);

  // Expanded card state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<JobApplication>>({});
  const [linkedContacts, setLinkedContacts] = useState<Contact[]>([]);
  const [linkContactId, setLinkContactId] = useState<string>("");

  // Drag ref
  const dragRef = useRef<{ applicationId: string; fromStatus: string } | null>(null);
  // Ref map for moved-card pop animation
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastMovedId = useRef<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [animReady, setAnimReady] = useState(false);

  // ─── Fetch helpers ────────────────────────────────────────────────────────

  const fetchApplications = useCallback(async () => {
    const res = await fetch("/api/applications");
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Failed to load applications");
      return;
    }
    const data: JobApplication[] = await res.json();
    setApplications(data);
    setAnimReady(true);
  }, []);

  const fetchContacts = useCallback(async () => {
    const res = await fetch("/api/contacts");
    if (res.ok) setAllContacts(await res.json());
  }, []);

  const fetchLinkedContacts = useCallback(async (appId: string) => {
    const res = await fetch(`/api/applications/${appId}/contacts`);
    if (res.ok) setLinkedContacts(await res.json());
    else setLinkedContacts([]);
  }, []);

  useEffect(() => {
    Promise.all([fetchApplications(), fetchContacts()]).finally(() =>
      setLoading(false),
    );
  }, [fetchApplications, fetchContacts]);

  // ─── GSAP: staggered fade-in on initial load ─────────────────────────────

  useGSAP(
    () => {
      if (!animReady) return;
      gsap.from(".kanban-card", {
        opacity: 0,
        y: 12,
        stagger: 0.04,
        duration: 0.3,
        ease: "power2.out",
      });
    },
    { scope: containerRef, dependencies: [animReady] },
  );

  // Pop animation when a card moves column
  useEffect(() => {
    const id = lastMovedId.current;
    if (!id) return;
    const el = cardRefs.current.get(id);
    if (el) {
      gsap.from(el, { scale: 0.95, duration: 0.2, ease: "back.out(1.5)" });
    }
    lastMovedId.current = null;
  });

  // ─── Group by status ──────────────────────────────────────────────────────

  const byStatus: Record<string, JobApplication[]> = {};
  for (const col of COLUMNS) byStatus[col] = [];
  for (const app of applications) {
    if (byStatus[app.status]) byStatus[app.status].push(app);
    else byStatus["Wishlist"].push(app); // fallback
  }

  // ─── Drag handlers ────────────────────────────────────────────────────────

  function handleDragStart(app: JobApplication) {
    dragRef.current = { applicationId: app.id, fromStatus: app.status };
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function handleDrop(e: React.DragEvent, toStatus: Status) {
    e.preventDefault();
    const payload = dragRef.current;
    dragRef.current = null;
    if (!payload || payload.fromStatus === toStatus) return;

    // Optimistic update
    setApplications((prev) =>
      prev.map((a) =>
        a.id === payload.applicationId ? { ...a, status: toStatus } : a,
      ),
    );
    lastMovedId.current = payload.applicationId;

    const res = await fetch(`/api/applications/${payload.applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: toStatus }),
    });
    if (!res.ok) {
      // Rollback
      setApplications((prev) =>
        prev.map((a) =>
          a.id === payload.applicationId
            ? { ...a, status: payload.fromStatus }
            : a,
        ),
      );
    }
  }

  // ─── Add card ─────────────────────────────────────────────────────────────

  function openAddForm(status: Status) {
    setAddingIn(status);
    setAddForm(emptyForm());
    setAddError(null);
  }

  async function submitAdd(status: Status) {
    if (!addForm.company.trim() || !addForm.role.trim()) {
      setAddError("Company and role are required.");
      return;
    }
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: addForm.company.trim(),
        role: addForm.role.trim(),
        status,
        applied_at: addForm.applied_at || null,
        url: addForm.url || null,
        notes: addForm.notes || null,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setAddError(j.error ?? "Failed to add application");
      return;
    }
    const newApp: JobApplication = await res.json();
    setApplications((prev) => [newApp, ...prev]);
    setAddingIn(null);
  }

  // ─── Delete card ──────────────────────────────────────────────────────────

  async function deleteApp(id: string) {
    const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setApplications((prev) => prev.filter((a) => a.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
  }

  // ─── Expand / edit card ───────────────────────────────────────────────────

  function openExpanded(app: JobApplication) {
    setExpandedId(app.id);
    setEditForm({
      company: app.company,
      role: app.role,
      status: app.status,
      applied_at: app.applied_at ?? "",
      url: app.url ?? "",
      notes: app.notes ?? "",
    });
    setLinkContactId("");
    fetchLinkedContacts(app.id);
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: editForm.company,
        role: editForm.role,
        status: editForm.status,
        applied_at: (editForm.applied_at as string) || null,
        url: (editForm.url as string) || null,
        notes: (editForm.notes as string) || null,
      }),
    });
    if (res.ok) {
      const updated: JobApplication = await res.json();
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...updated } : a)),
      );
      setExpandedId(null);
    }
  }

  // ─── Contact linking ──────────────────────────────────────────────────────

  async function linkContact(appId: string, contactId: string) {
    if (!contactId) return;
    await fetch(`/api/applications/${appId}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_id: contactId }),
    });
    fetchLinkedContacts(appId);
    setLinkContactId("");
  }

  async function unlinkContact(appId: string, contactId: string) {
    await fetch(`/api/applications/${appId}/contacts`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_id: contactId }),
    });
    fetchLinkedContacts(appId);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) return <p className="p-6 text-white/60">Loading...</p>;
  if (error) return <p className="p-6 text-red-400">{error}</p>;

  return (
    <div ref={containerRef} className="flex h-full flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold text-white">Applications</h1>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const cards = byStatus[col] ?? [];
          return (
            <div
              key={col}
              className="flex w-64 shrink-0 flex-col gap-2 rounded-md border border-white/10 bg-black/20 p-3"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{col}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              {cards.map((app) => (
                <div
                  key={app.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(app.id, el);
                    else cardRefs.current.delete(app.id);
                  }}
                  className="kanban-card cursor-grab rounded-md border border-white/10 bg-white/5 p-3 hover:bg-white/10"
                  draggable
                  onDragStart={() => handleDragStart(app)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => openExpanded(app)}
                    >
                      <p className="truncate font-medium text-white">
                        {app.company}
                      </p>
                      <p className="truncate text-xs text-white/60">{app.role}</p>
                      {app.applied_at && (
                        <p className="mt-1 text-xs text-white/40">
                          {app.applied_at}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteApp(app.id);
                      }}
                      className="shrink-0 text-white/30 hover:text-red-400"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              {/* Add form or add button */}
              {addingIn === col ? (
                <div className="flex flex-col gap-2 rounded-md border border-white/10 bg-white/5 p-2">
                  {addError && (
                    <p className="text-xs text-red-400">{addError}</p>
                  )}
                  <input
                    className="w-full rounded bg-white/10 px-2 py-1 text-sm text-white placeholder-white/30 outline-none"
                    placeholder="Company *"
                    value={addForm.company}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, company: e.target.value }))
                    }
                  />
                  <input
                    className="w-full rounded bg-white/10 px-2 py-1 text-sm text-white placeholder-white/30 outline-none"
                    placeholder="Role *"
                    value={addForm.role}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, role: e.target.value }))
                    }
                  />
                  <input
                    type="date"
                    className="w-full rounded bg-white/10 px-2 py-1 text-sm text-white/60 outline-none"
                    placeholder="Applied date"
                    value={addForm.applied_at}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, applied_at: e.target.value }))
                    }
                  />
                  <input
                    className="w-full rounded bg-white/10 px-2 py-1 text-sm text-white placeholder-white/30 outline-none"
                    placeholder="URL"
                    value={addForm.url}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, url: e.target.value }))
                    }
                  />
                  <textarea
                    className="w-full rounded bg-white/10 px-2 py-1 text-sm text-white placeholder-white/30 outline-none"
                    placeholder="Notes"
                    rows={2}
                    value={addForm.notes}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, notes: e.target.value }))
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitAdd(col)}
                      className="flex-1 rounded bg-white/20 py-1 text-xs text-white hover:bg-white/30"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setAddingIn(null)}
                      className="rounded px-2 py-1 text-xs text-white/40 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => openAddForm(col)}
                  className="mt-1 rounded py-1 text-xs text-white/30 hover:bg-white/5 hover:text-white/60"
                >
                  + Add
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded card detail panel */}
      {expandedId && (() => {
        const app = applications.find((a) => a.id === expandedId);
        if (!app) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-md border border-white/10 bg-gray-900 p-6 text-white">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Edit Application</h2>
                <button
                  onClick={() => setExpandedId(null)}
                  className="text-white/40 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/60">Company *</label>
                  <input
                    className="rounded bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    value={(editForm.company as string) ?? ""}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, company: e.target.value }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/60">Role *</label>
                  <input
                    className="rounded bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    value={(editForm.role as string) ?? ""}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, role: e.target.value }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/60">Status</label>
                  <select
                    className="rounded bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    value={(editForm.status as string) ?? "Wishlist"}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, status: e.target.value }))
                    }
                  >
                    {COLUMNS.map((c) => (
                      <option key={c} value={c} className="bg-gray-900">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/60">Applied date</label>
                  <input
                    type="date"
                    className="rounded bg-white/10 px-3 py-2 text-sm text-white/60 outline-none"
                    value={(editForm.applied_at as string) ?? ""}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, applied_at: e.target.value }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/60">URL</label>
                  <input
                    className="rounded bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    value={(editForm.url as string) ?? ""}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, url: e.target.value }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/60">Notes</label>
                  <textarea
                    className="rounded bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    rows={3}
                    value={(editForm.notes as string) ?? ""}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, notes: e.target.value }))
                    }
                  />
                </div>

                {/* Linked contacts */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/60">Linked contacts</label>
                  <div className="flex flex-wrap gap-2">
                    {linkedContacts.map((c) => (
                      <span
                        key={c.id}
                        className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white"
                      >
                        {c.name}
                        <button
                          onClick={() => unlinkContact(app.id, c.id)}
                          className="text-white/40 hover:text-red-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {linkedContacts.length === 0 && (
                      <span className="text-xs text-white/30">None</span>
                    )}
                  </div>
                  {allContacts.length > 0 && (
                    <div className="flex gap-2">
                      <select
                        className="flex-1 rounded bg-white/10 px-2 py-1 text-sm text-white outline-none"
                        value={linkContactId}
                        onChange={(e) => setLinkContactId(e.target.value)}
                      >
                        <option value="" className="bg-gray-900">
                          Select a contact...
                        </option>
                        {allContacts
                          .filter((c) => !linkedContacts.some((l) => l.id === c.id))
                          .map((c) => (
                            <option key={c.id} value={c.id} className="bg-gray-900">
                              {c.name}
                              {c.company ? ` — ${c.company}` : ""}
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={() => linkContact(app.id, linkContactId)}
                        disabled={!linkContactId}
                        className="rounded bg-white/20 px-3 py-1 text-xs text-white hover:bg-white/30 disabled:opacity-40"
                      >
                        Link
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setExpandedId(null)}
                    className="rounded px-4 py-2 text-sm text-white/40 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveEdit(app.id)}
                    className="rounded bg-white/20 px-4 py-2 text-sm text-white hover:bg-white/30"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
