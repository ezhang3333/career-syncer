"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Contact } from "@/lib/types/database";
import ClusterViz from "@/components/networking/ClusterViz";

const CATEGORIES = ["Tech", "Government", "Finance", "Academia", "Other"];

const EMPTY_FORM = {
  name: "",
  company: "",
  category: "",
  role: "",
  how_met: "",
  notes: "",
  last_contacted: "",
  linkedin_url: "",
};

type FormState = typeof EMPTY_FORM;

export default function NetworkingPage() {
  const container = useRef<HTMLDivElement>(null);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(EMPTY_FORM);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSaving, setAddSaving] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [view, setView] = useState<"list" | "viz">("list");

  // Fetch contacts on mount
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/contacts");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Failed to load contacts");
        setLoading(false);
        return;
      }
      const data: Contact[] = await res.json();
      setContacts(data);
      setLoading(false);
    }
    load();
  }, []);

  // Staggered fade-in for list rows
  useGSAP(
    () => {
      if (!loading && contacts.length > 0) {
        gsap.from(".contact-row", {
          opacity: 0,
          y: 16,
          duration: 0.35,
          ease: "power2.out",
          stagger: 0.05,
        });
      }
    },
    { scope: container, dependencies: [loading, contacts.length] },
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.name.trim()) {
      setAddError("Name is required");
      return;
    }
    setAddSaving(true);
    setAddError(null);

    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: addForm.name.trim(),
        company: addForm.company.trim() || null,
        category: addForm.category || null,
        role: addForm.role.trim() || null,
        how_met: addForm.how_met.trim() || null,
        notes: addForm.notes.trim() || null,
        last_contacted: addForm.last_contacted || null,
        linkedin_url: addForm.linkedin_url.trim() || null,
      }),
    });

    setAddSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setAddError(body.error ?? "Failed to add contact");
      return;
    }

    const created: Contact = await res.json();
    setContacts((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    setAddForm(EMPTY_FORM);
    setShowAddForm(false);
  }

  function startEdit(contact: Contact) {
    setEditId(contact.id);
    setEditForm({
      name: contact.name,
      company: contact.company ?? "",
      category: contact.category ?? "",
      role: contact.role ?? "",
      how_met: contact.how_met ?? "",
      notes: contact.notes ?? "",
      last_contacted: contact.last_contacted ?? "",
      linkedin_url: contact.linkedin_url ?? "",
    });
    setEditError(null);
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm(EMPTY_FORM);
    setEditError(null);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    if (!editForm.name.trim()) {
      setEditError("Name is required");
      return;
    }
    setEditSaving(true);
    setEditError(null);

    const res = await fetch(`/api/contacts/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name.trim(),
        company: editForm.company.trim() || null,
        category: editForm.category || null,
        role: editForm.role.trim() || null,
        how_met: editForm.how_met.trim() || null,
        notes: editForm.notes.trim() || null,
        last_contacted: editForm.last_contacted || null,
        linkedin_url: editForm.linkedin_url.trim() || null,
      }),
    });

    setEditSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setEditError(body.error ?? "Failed to update contact");
      return;
    }

    const updated: Contact = await res.json();
    setContacts((prev) =>
      prev
        .map((c) => (c.id === updated.id ? updated : c))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
    cancelEdit();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to delete contact");
      return;
    }
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div ref={container} className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Networking</h1>
          {/* View toggle */}
          <div className="flex rounded-md border border-white/10 p-0.5 text-sm">
            <button
              onClick={() => setView("list")}
              className={`rounded px-3 py-1 transition-colors ${
                view === "list"
                  ? "bg-white text-black"
                  : "text-white/60 hover:text-white"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setView("viz")}
              className={`rounded px-3 py-1 transition-colors ${
                view === "viz"
                  ? "bg-white text-black"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Visualization
            </button>
          </div>
        </div>
        {view === "list" && (
          <button
            onClick={() => {
              setShowAddForm((v) => !v);
              setAddForm(EMPTY_FORM);
              setAddError(null);
            }}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            {showAddForm ? "Cancel" : "Add Contact"}
          </button>
        )}
      </div>

      {/* Visualization view */}
      {view === "viz" && <ClusterViz />}

      {/* Add form */}
      {view === "list" && showAddForm && (
        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-4 rounded-md border border-white/10 bg-white/5 p-4"
        >
          <h2 className="text-sm font-medium text-white/80">New Contact</h2>
          <ContactFields form={addForm} setForm={setAddForm} />
          {addError && <p className="text-sm text-red-400">{addError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={addSaving}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {addSaving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setAddForm(EMPTY_FORM);
                setAddError(null);
              }}
              className="rounded-md border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Error */}
      {view === "list" && error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {/* Loading */}
      {view === "list" && loading && (
        <p className="text-sm text-white/40">Loading...</p>
      )}

      {/* Empty state */}
      {view === "list" && !loading && !error && contacts.length === 0 && (
        <p className="text-sm text-white/40">No contacts yet. Add one above.</p>
      )}

      {/* Contact list */}
      {view === "list" && !loading && contacts.length > 0 && (
        <div className="flex flex-col gap-2">
          {contacts.map((contact) =>
            editId === contact.id ? (
              <form
                key={contact.id}
                onSubmit={handleEdit}
                className="contact-row flex flex-col gap-4 rounded-md border border-white/10 bg-white/5 p-4"
              >
                <h2 className="text-sm font-medium text-white/80">Edit Contact</h2>
                <ContactFields form={editForm} setForm={setEditForm} />
                {editError && <p className="text-sm text-red-400">{editError}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {editSaving ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-md border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div
                key={contact.id}
                className="contact-row flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{contact.name}</span>
                    {contact.category && (
                      <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs text-white/60">
                        {contact.category}
                      </span>
                    )}
                  </div>
                  {(contact.company || contact.role) && (
                    <span className="text-sm text-white/60">
                      {[contact.role, contact.company].filter(Boolean).join(" @ ")}
                    </span>
                  )}
                  {contact.last_contacted && (
                    <span className="text-xs text-white/40">
                      Last contacted:{" "}
                      {new Date(contact.last_contacted).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2 pl-4">
                  <button
                    onClick={() => startEdit(contact)}
                    className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="rounded-md border border-red-500/20 px-3 py-1.5 text-xs text-red-400/70 hover:border-red-500/40 hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

// Shared form fields component
function ContactFields({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  function field(key: keyof FormState) {
    return (value: string) => setForm((f) => ({ ...f, [key]: value }));
  }

  const inputClass =
    "rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-white/50">Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => field("name")(e.target.value)}
          placeholder="Jane Smith"
          className={inputClass}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-white/50">Company</label>
        <input
          type="text"
          value={form.company}
          onChange={(e) => field("company")(e.target.value)}
          placeholder="Acme Corp"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-white/50">Role</label>
        <input
          type="text"
          value={form.role}
          onChange={(e) => field("role")(e.target.value)}
          placeholder="Software Engineer"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-white/50">Category</label>
        <select
          value={form.category}
          onChange={(e) => field("category")(e.target.value)}
          className={inputClass}
        >
          <option value="">— select —</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-white/50">How we met</label>
        <input
          type="text"
          value={form.how_met}
          onChange={(e) => field("how_met")(e.target.value)}
          placeholder="Conference, referral..."
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-white/50">Last contacted</label>
        <input
          type="date"
          value={form.last_contacted}
          onChange={(e) => field("last_contacted")(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-white/50">LinkedIn URL</label>
        <input
          type="url"
          value={form.linkedin_url}
          onChange={(e) => field("linkedin_url")(e.target.value)}
          placeholder="https://linkedin.com/in/..."
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className="text-xs text-white/50">Notes</label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => field("notes")(e.target.value)}
          placeholder="Any notes about this contact..."
          className={`resize-none ${inputClass}`}
        />
      </div>
    </div>
  );
}
