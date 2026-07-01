"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import LinkedInSyncToast from "@/components/LinkedInSyncToast";
import type {
  WorkExperience,
  Project,
  Education,
  Skill,
  Certification,
} from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = "work" | "projects" | "education" | "skills" | "certifications";

// ---------------------------------------------------------------------------
// Small shared UI
// ---------------------------------------------------------------------------

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-white/50 mb-1">
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 disabled:opacity-40"
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={props.rows ?? 4}
      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-md border border-white/10 bg-[#0a0a0b] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30"
    />
  );
}

function FormRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>;
}

// ---------------------------------------------------------------------------
// Slide-in Panel
// ---------------------------------------------------------------------------

function Panel({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Animate in
  useEffect(() => {
    if (!open || !panelRef.current || !overlayRef.current) return;
    gsap.fromTo(
      overlayRef.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.2, ease: "power2.out" },
    );
    gsap.fromTo(
      panelRef.current,
      { x: "100%" },
      { x: "0%", duration: 0.3, ease: "power3.out" },
    );
  }, [open]);

  const handleClose = () => {
    if (!panelRef.current || !overlayRef.current) {
      onClose();
      return;
    }
    gsap.to(overlayRef.current, { autoAlpha: 0, duration: 0.2 });
    gsap.to(panelRef.current, {
      x: "100%",
      duration: 0.25,
      ease: "power3.in",
      onComplete: onClose,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/60"
        onClick={handleClose}
      />
      <div
        ref={panelRef}
        className="relative z-10 flex h-full w-full max-w-lg flex-col bg-[#111113] shadow-2xl"
        style={{ transform: "translateX(100%)" }}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            onClick={handleClose}
            className="rounded p-1 text-white/40 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirm
// ---------------------------------------------------------------------------

function DeleteConfirm({
  onConfirm,
  onCancel,
  itemRef,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  itemRef: React.RefObject<HTMLDivElement | null>;
}) {
  useEffect(() => {
    if (!itemRef.current) return;
    gsap.to(itemRef.current, {
      x: -6,
      duration: 0.06,
      repeat: 5,
      yoyo: true,
      ease: "power1.inOut",
      onComplete: () => {
        if (itemRef.current) gsap.set(itemRef.current, { x: 0 });
      },
    });
  }, [itemRef]);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-white/60">Delete?</span>
      <button
        onClick={onConfirm}
        className="rounded bg-red-500/20 px-2 py-0.5 text-red-400 hover:bg-red-500/30 transition-colors"
      >
        Yes
      </button>
      <button
        onClick={onCancel}
        className="rounded bg-white/5 px-2 py-0.5 text-white/60 hover:bg-white/10 transition-colors"
      >
        No
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generic list item wrapper
// ---------------------------------------------------------------------------

function ListItem({
  onEdit,
  onDelete,
  children,
}: {
  onEdit: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={itemRef}
      className="flex items-start justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3"
    >
      <div className="min-w-0 flex-1">{children}</div>
      <div className="flex shrink-0 items-center gap-2">
        {confirming ? (
          <DeleteConfirm
            onConfirm={onDelete}
            onCancel={() => setConfirming(false)}
            itemRef={itemRef}
          />
        ) : (
          <>
            <button
              onClick={onEdit}
              className="rounded px-2 py-1 text-xs text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="rounded px-2 py-1 text-xs text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-colors"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Animated list wrapper
// ---------------------------------------------------------------------------

function AnimatedList({ children }: { children: React.ReactNode }) {
  const listRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const items = listRef.current?.querySelectorAll(":scope > *");
      if (!items || items.length === 0) return;
      gsap.fromTo(
        items,
        { autoAlpha: 0, y: 8 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.05,
          ease: "power2.out",
        },
      );
    },
    { scope: listRef, dependencies: [children] },
  );

  return (
    <div ref={listRef} className="flex flex-col gap-2">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Work Experience
// ---------------------------------------------------------------------------

type WEForm = Omit<WorkExperience, "id" | "created_at" | "updated_at"> & {
  description_text: string;
};

function defaultWEForm(): WEForm {
  return {
    title: "",
    company: "",
    location: "",
    start_date: "",
    end_date: "",
    is_current: false,
    description: [],
    description_text: "",
  };
}

function WorkExperienceForm({
  initial,
  onSave,
  saving,
}: {
  initial: WEForm;
  onSave: (f: WEForm) => void;
  saving: boolean;
}) {
  const [f, setF] = useState<WEForm>(initial);

  const set = (k: keyof WEForm, v: unknown) =>
    setF((prev) => ({ ...prev, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(f);
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <Label>Title *</Label>
        <Input
          value={f.title}
          onChange={(e) => set("title", e.target.value)}
          required
          placeholder="Software Engineer"
        />
      </div>
      <div>
        <Label>Company *</Label>
        <Input
          value={f.company}
          onChange={(e) => set("company", e.target.value)}
          required
          placeholder="Acme Corp"
        />
      </div>
      <div>
        <Label>Location</Label>
        <Input
          value={f.location ?? ""}
          onChange={(e) => set("location", e.target.value)}
          placeholder="San Francisco, CA"
        />
      </div>
      <FormRow>
        <div>
          <Label>Start Date *</Label>
          <Input
            type="date"
            value={f.start_date}
            onChange={(e) => set("start_date", e.target.value)}
            required
          />
        </div>
        <div>
          <Label>End Date</Label>
          <Input
            type="date"
            value={f.end_date ?? ""}
            onChange={(e) => set("end_date", e.target.value)}
            disabled={f.is_current}
          />
        </div>
      </FormRow>
      <div className="flex items-center gap-2">
        <input
          id="is_current"
          type="checkbox"
          checked={f.is_current}
          onChange={(e) => {
            set("is_current", e.target.checked);
            if (e.target.checked) set("end_date", "");
          }}
          className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white"
        />
        <label htmlFor="is_current" className="text-sm text-white/60">
          Currently working here
        </label>
      </div>
      <div>
        <Label>Description (one bullet per line)</Label>
        <Textarea
          value={f.description_text}
          onChange={(e) => set("description_text", e.target.value)}
          placeholder={"Built scalable APIs\nLed team of 5 engineers"}
          rows={5}
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="mt-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function WorkExperienceTab({
  onMutationSuccess,
}: {
  onMutationSuccess: () => void;
}) {
  const [records, setRecords] = useState<WorkExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<WorkExperience | null>(null);
  const [formData, setFormData] = useState<WEForm>(defaultWEForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/work-experiences");
    const data = await res.json();
    setRecords(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; project doesn't use React Compiler
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setFormData(defaultWEForm());
    setPanelOpen(true);
  };

  const openEdit = (r: WorkExperience) => {
    setEditing(r);
    setFormData({
      title: r.title,
      company: r.company,
      location: r.location ?? "",
      start_date: r.start_date,
      end_date: r.end_date ?? "",
      is_current: r.is_current,
      description: r.description,
      description_text: r.description.join("\n"),
    });
    setPanelOpen(true);
  };

  const handleSave = async (f: WEForm) => {
    setSaving(true);
    const payload = {
      ...f,
      description: f.description_text
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      location: f.location || null,
      end_date: f.end_date || null,
    };
    if (editing) {
      await fetch(`/api/work-experiences/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/work-experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    setPanelOpen(false);
    onMutationSuccess();
    load();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/work-experiences/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <>
      <TabHeader title="Work Experience" onAdd={openAdd} />
      {loading ? (
        <EmptyState>Loading…</EmptyState>
      ) : records.length === 0 ? (
        <EmptyState>No work experience yet.</EmptyState>
      ) : (
        <AnimatedList>
          {records.map((r) => (
            <ListItem
              key={r.id}
              onEdit={() => openEdit(r)}
              onDelete={() => handleDelete(r.id)}
            >
              <p className="text-sm font-medium">{r.title}</p>
              <p className="text-xs text-white/50">
                {r.company}
                {r.location ? ` · ${r.location}` : ""}
              </p>
              <p className="text-xs text-white/30 mt-0.5">
                {r.start_date} — {r.is_current ? "Present" : (r.end_date ?? "—")}
              </p>
            </ListItem>
          ))}
        </AnimatedList>
      )}
      <Panel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? "Edit Work Experience" : "Add Work Experience"}
      >
        <WorkExperienceForm
          key={editing ? editing.id : "new"}
          initial={formData}
          onSave={handleSave}
          saving={saving}
        />
      </Panel>
    </>
  );
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

type ProjectForm = Omit<Project, "id" | "created_at" | "updated_at"> & {
  tech_stack_text: string;
};

function defaultProjectForm(): ProjectForm {
  return {
    name: "",
    description: "",
    url: "",
    tech_stack: [],
    tech_stack_text: "",
    start_date: "",
    end_date: "",
  };
}

function ProjectFormUI({
  initial,
  onSave,
  saving,
}: {
  initial: ProjectForm;
  onSave: (f: ProjectForm) => void;
  saving: boolean;
}) {
  const [f, setF] = useState<ProjectForm>(initial);

  const set = (k: keyof ProjectForm, v: unknown) =>
    setF((prev) => ({ ...prev, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(f);
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <Label>Name *</Label>
        <Input
          value={f.name}
          onChange={(e) => set("name", e.target.value)}
          required
          placeholder="My Awesome Project"
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={f.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What did you build?"
        />
      </div>
      <div>
        <Label>URL</Label>
        <Input
          value={f.url ?? ""}
          onChange={(e) => set("url", e.target.value)}
          placeholder="https://github.com/..."
        />
      </div>
      <div>
        <Label>Tech Stack (comma-separated)</Label>
        <Input
          value={f.tech_stack_text}
          onChange={(e) => set("tech_stack_text", e.target.value)}
          placeholder="React, TypeScript, PostgreSQL"
        />
      </div>
      <FormRow>
        <div>
          <Label>Start Date</Label>
          <Input
            type="date"
            value={f.start_date ?? ""}
            onChange={(e) => set("start_date", e.target.value)}
          />
        </div>
        <div>
          <Label>End Date</Label>
          <Input
            type="date"
            value={f.end_date ?? ""}
            onChange={(e) => set("end_date", e.target.value)}
          />
        </div>
      </FormRow>
      <button
        type="submit"
        disabled={saving}
        className="mt-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function ProjectsTab({
  onMutationSuccess,
}: {
  onMutationSuccess: () => void;
}) {
  const [records, setRecords] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectForm>(defaultProjectForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/projects");
    const data = await res.json();
    setRecords(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; project doesn't use React Compiler
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setFormData(defaultProjectForm());
    setPanelOpen(true);
  };

  const openEdit = (r: Project) => {
    setEditing(r);
    setFormData({
      name: r.name,
      description: r.description ?? "",
      url: r.url ?? "",
      tech_stack: r.tech_stack,
      tech_stack_text: r.tech_stack.join(", "),
      start_date: r.start_date ?? "",
      end_date: r.end_date ?? "",
    });
    setPanelOpen(true);
  };

  const handleSave = async (f: ProjectForm) => {
    setSaving(true);
    const payload = {
      ...f,
      tech_stack: f.tech_stack_text
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      description: f.description || null,
      url: f.url || null,
      start_date: f.start_date || null,
      end_date: f.end_date || null,
    };
    if (editing) {
      await fetch(`/api/projects/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    setPanelOpen(false);
    onMutationSuccess();
    load();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <>
      <TabHeader title="Projects" onAdd={openAdd} />
      {loading ? (
        <EmptyState>Loading…</EmptyState>
      ) : records.length === 0 ? (
        <EmptyState>No projects yet.</EmptyState>
      ) : (
        <AnimatedList>
          {records.map((r) => (
            <ListItem
              key={r.id}
              onEdit={() => openEdit(r)}
              onDelete={() => handleDelete(r.id)}
            >
              <p className="text-sm font-medium">{r.name}</p>
              {r.tech_stack.length > 0 && (
                <p className="text-xs text-white/40 mt-0.5">
                  {r.tech_stack.join(", ")}
                </p>
              )}
              {r.url && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:underline mt-0.5 block"
                >
                  {r.url}
                </a>
              )}
            </ListItem>
          ))}
        </AnimatedList>
      )}
      <Panel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? "Edit Project" : "Add Project"}
      >
        <ProjectFormUI
          key={editing ? editing.id : "new"}
          initial={formData}
          onSave={handleSave}
          saving={saving}
        />
      </Panel>
    </>
  );
}

// ---------------------------------------------------------------------------
// Education
// ---------------------------------------------------------------------------

type EducationForm = Omit<Education, "id" | "created_at" | "updated_at">;

function defaultEducationForm(): EducationForm {
  return {
    institution: "",
    degree: "",
    field_of_study: "",
    start_date: "",
    end_date: "",
    gpa: null,
  };
}

function EducationFormUI({
  initial,
  onSave,
  saving,
}: {
  initial: EducationForm;
  onSave: (f: EducationForm) => void;
  saving: boolean;
}) {
  const [f, setF] = useState<EducationForm>(initial);

  const set = (k: keyof EducationForm, v: unknown) =>
    setF((prev) => ({ ...prev, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(f);
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <Label>Institution *</Label>
        <Input
          value={f.institution}
          onChange={(e) => set("institution", e.target.value)}
          required
          placeholder="MIT"
        />
      </div>
      <div>
        <Label>Degree *</Label>
        <Input
          value={f.degree}
          onChange={(e) => set("degree", e.target.value)}
          required
          placeholder="Bachelor of Science"
        />
      </div>
      <div>
        <Label>Field of Study</Label>
        <Input
          value={f.field_of_study ?? ""}
          onChange={(e) => set("field_of_study", e.target.value)}
          placeholder="Computer Science"
        />
      </div>
      <FormRow>
        <div>
          <Label>Start Date</Label>
          <Input
            type="date"
            value={f.start_date ?? ""}
            onChange={(e) => set("start_date", e.target.value)}
          />
        </div>
        <div>
          <Label>End Date</Label>
          <Input
            type="date"
            value={f.end_date ?? ""}
            onChange={(e) => set("end_date", e.target.value)}
          />
        </div>
      </FormRow>
      <div>
        <Label>GPA</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          max="4"
          value={f.gpa ?? ""}
          onChange={(e) =>
            set("gpa", e.target.value ? parseFloat(e.target.value) : null)
          }
          placeholder="3.8"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="mt-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function EducationTab({
  onMutationSuccess,
}: {
  onMutationSuccess: () => void;
}) {
  const [records, setRecords] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Education | null>(null);
  const [formData, setFormData] = useState<EducationForm>(
    defaultEducationForm(),
  );
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/education");
    const data = await res.json();
    setRecords(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; project doesn't use React Compiler
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setFormData(defaultEducationForm());
    setPanelOpen(true);
  };

  const openEdit = (r: Education) => {
    setEditing(r);
    setFormData({
      institution: r.institution,
      degree: r.degree,
      field_of_study: r.field_of_study ?? "",
      start_date: r.start_date ?? "",
      end_date: r.end_date ?? "",
      gpa: r.gpa,
    });
    setPanelOpen(true);
  };

  const handleSave = async (f: EducationForm) => {
    setSaving(true);
    const payload = {
      ...f,
      field_of_study: f.field_of_study || null,
      start_date: f.start_date || null,
      end_date: f.end_date || null,
    };
    if (editing) {
      await fetch(`/api/education/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    setPanelOpen(false);
    onMutationSuccess();
    load();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/education/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <>
      <TabHeader title="Education" onAdd={openAdd} />
      {loading ? (
        <EmptyState>Loading…</EmptyState>
      ) : records.length === 0 ? (
        <EmptyState>No education yet.</EmptyState>
      ) : (
        <AnimatedList>
          {records.map((r) => (
            <ListItem
              key={r.id}
              onEdit={() => openEdit(r)}
              onDelete={() => handleDelete(r.id)}
            >
              <p className="text-sm font-medium">
                {r.degree}
                {r.field_of_study ? ` in ${r.field_of_study}` : ""}
              </p>
              <p className="text-xs text-white/50">{r.institution}</p>
              {r.gpa && (
                <p className="text-xs text-white/30 mt-0.5">GPA: {r.gpa}</p>
              )}
            </ListItem>
          ))}
        </AnimatedList>
      )}
      <Panel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? "Edit Education" : "Add Education"}
      >
        <EducationFormUI
          key={editing ? editing.id : "new"}
          initial={formData}
          onSave={handleSave}
          saving={saving}
        />
      </Panel>
    </>
  );
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

type SkillForm = Omit<Skill, "id" | "created_at" | "updated_at">;

function defaultSkillForm(): SkillForm {
  return { name: "", category: "", proficiency_level: "" };
}

function SkillFormUI({
  initial,
  onSave,
  saving,
}: {
  initial: SkillForm;
  onSave: (f: SkillForm) => void;
  saving: boolean;
}) {
  const [f, setF] = useState<SkillForm>(initial);

  const set = (k: keyof SkillForm, v: unknown) =>
    setF((prev) => ({ ...prev, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(f);
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <Label>Name *</Label>
        <Input
          value={f.name}
          onChange={(e) => set("name", e.target.value)}
          required
          placeholder="TypeScript"
        />
      </div>
      <div>
        <Label>Category</Label>
        <Input
          value={f.category ?? ""}
          onChange={(e) => set("category", e.target.value)}
          placeholder="Programming Languages"
        />
      </div>
      <div>
        <Label>Proficiency Level</Label>
        <Select
          value={f.proficiency_level ?? ""}
          onChange={(e) => set("proficiency_level", e.target.value)}
        >
          <option value="">— Select —</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
          <option value="Expert">Expert</option>
        </Select>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="mt-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function SkillsTab({
  onMutationSuccess,
}: {
  onMutationSuccess: () => void;
}) {
  const [records, setRecords] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [formData, setFormData] = useState<SkillForm>(defaultSkillForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/skills");
    const data = await res.json();
    setRecords(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; project doesn't use React Compiler
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setFormData(defaultSkillForm());
    setPanelOpen(true);
  };

  const openEdit = (r: Skill) => {
    setEditing(r);
    setFormData({
      name: r.name,
      category: r.category ?? "",
      proficiency_level: r.proficiency_level ?? "",
    });
    setPanelOpen(true);
  };

  const handleSave = async (f: SkillForm) => {
    setSaving(true);
    const payload = {
      ...f,
      category: f.category || null,
      proficiency_level: f.proficiency_level || null,
    };
    if (editing) {
      await fetch(`/api/skills/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    setPanelOpen(false);
    onMutationSuccess();
    load();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/skills/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <>
      <TabHeader title="Skills" onAdd={openAdd} />
      {loading ? (
        <EmptyState>Loading…</EmptyState>
      ) : records.length === 0 ? (
        <EmptyState>No skills yet.</EmptyState>
      ) : (
        <AnimatedList>
          {records.map((r) => (
            <ListItem
              key={r.id}
              onEdit={() => openEdit(r)}
              onDelete={() => handleDelete(r.id)}
            >
              <p className="text-sm font-medium">{r.name}</p>
              <p className="text-xs text-white/40 mt-0.5">
                {[r.category, r.proficiency_level].filter(Boolean).join(" · ")}
              </p>
            </ListItem>
          ))}
        </AnimatedList>
      )}
      <Panel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? "Edit Skill" : "Add Skill"}
      >
        <SkillFormUI
          key={editing ? editing.id : "new"}
          initial={formData}
          onSave={handleSave}
          saving={saving}
        />
      </Panel>
    </>
  );
}

// ---------------------------------------------------------------------------
// Certifications
// ---------------------------------------------------------------------------

type CertForm = Omit<Certification, "id" | "created_at" | "updated_at">;

function defaultCertForm(): CertForm {
  return {
    name: "",
    issuer: "",
    issue_date: "",
    expiry_date: "",
    url: "",
  };
}

function CertFormUI({
  initial,
  onSave,
  saving,
}: {
  initial: CertForm;
  onSave: (f: CertForm) => void;
  saving: boolean;
}) {
  const [f, setF] = useState<CertForm>(initial);

  const set = (k: keyof CertForm, v: unknown) =>
    setF((prev) => ({ ...prev, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(f);
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <Label>Name *</Label>
        <Input
          value={f.name}
          onChange={(e) => set("name", e.target.value)}
          required
          placeholder="AWS Solutions Architect"
        />
      </div>
      <div>
        <Label>Issuer</Label>
        <Input
          value={f.issuer ?? ""}
          onChange={(e) => set("issuer", e.target.value)}
          placeholder="Amazon Web Services"
        />
      </div>
      <FormRow>
        <div>
          <Label>Issue Date</Label>
          <Input
            type="date"
            value={f.issue_date ?? ""}
            onChange={(e) => set("issue_date", e.target.value)}
          />
        </div>
        <div>
          <Label>Expiry Date</Label>
          <Input
            type="date"
            value={f.expiry_date ?? ""}
            onChange={(e) => set("expiry_date", e.target.value)}
          />
        </div>
      </FormRow>
      <div>
        <Label>URL</Label>
        <Input
          value={f.url ?? ""}
          onChange={(e) => set("url", e.target.value)}
          placeholder="https://credentials.example.com/..."
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="mt-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function CertificationsTab({
  onMutationSuccess,
}: {
  onMutationSuccess: () => void;
}) {
  const [records, setRecords] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Certification | null>(null);
  const [formData, setFormData] = useState<CertForm>(defaultCertForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/certifications");
    const data = await res.json();
    setRecords(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; project doesn't use React Compiler
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setFormData(defaultCertForm());
    setPanelOpen(true);
  };

  const openEdit = (r: Certification) => {
    setEditing(r);
    setFormData({
      name: r.name,
      issuer: r.issuer ?? "",
      issue_date: r.issue_date ?? "",
      expiry_date: r.expiry_date ?? "",
      url: r.url ?? "",
    });
    setPanelOpen(true);
  };

  const handleSave = async (f: CertForm) => {
    setSaving(true);
    const payload = {
      ...f,
      issuer: f.issuer || null,
      issue_date: f.issue_date || null,
      expiry_date: f.expiry_date || null,
      url: f.url || null,
    };
    if (editing) {
      await fetch(`/api/certifications/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    setPanelOpen(false);
    onMutationSuccess();
    load();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/certifications/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <>
      <TabHeader title="Certifications" onAdd={openAdd} />
      {loading ? (
        <EmptyState>Loading…</EmptyState>
      ) : records.length === 0 ? (
        <EmptyState>No certifications yet.</EmptyState>
      ) : (
        <AnimatedList>
          {records.map((r) => (
            <ListItem
              key={r.id}
              onEdit={() => openEdit(r)}
              onDelete={() => handleDelete(r.id)}
            >
              <p className="text-sm font-medium">{r.name}</p>
              {r.issuer && (
                <p className="text-xs text-white/50">{r.issuer}</p>
              )}
              {r.issue_date && (
                <p className="text-xs text-white/30 mt-0.5">
                  Issued {r.issue_date}
                  {r.expiry_date ? ` · Expires ${r.expiry_date}` : ""}
                </p>
              )}
            </ListItem>
          ))}
        </AnimatedList>
      )}
      <Panel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? "Edit Certification" : "Add Certification"}
      >
        <CertFormUI
          key={editing ? editing.id : "new"}
          initial={formData}
          onSave={handleSave}
          saving={saving}
        />
      </Panel>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared tab chrome
// ---------------------------------------------------------------------------

function TabHeader({
  title,
  onAdd,
}: {
  title: string;
  onAdd: () => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-semibold text-white/80">{title}</h2>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
      >
        <span className="text-base leading-none">+</span>
        Add
      </button>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-white/10">
      <p className="text-sm text-white/30">{children}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const TABS: { id: Tab; label: string }[] = [
  { id: "work", label: "Work Experience" },
  { id: "projects", label: "Projects" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "certifications", label: "Certifications" },
];

export default function CareerDataPage() {
  const [activeTab, setActiveTab] = useState<Tab>("work");
  const [showToast, setShowToast] = useState(false);

  const handleMutationSuccess = useCallback(() => {
    setShowToast(true);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <h1 className="text-2xl font-semibold tracking-tight">Career Data</h1>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-white text-white -mb-px"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6 flex-1">
        {activeTab === "work" && (
          <WorkExperienceTab onMutationSuccess={handleMutationSuccess} />
        )}
        {activeTab === "projects" && (
          <ProjectsTab onMutationSuccess={handleMutationSuccess} />
        )}
        {activeTab === "education" && (
          <EducationTab onMutationSuccess={handleMutationSuccess} />
        )}
        {activeTab === "skills" && (
          <SkillsTab onMutationSuccess={handleMutationSuccess} />
        )}
        {activeTab === "certifications" && (
          <CertificationsTab onMutationSuccess={handleMutationSuccess} />
        )}
      </div>

      <LinkedInSyncToast
        isVisible={showToast}
        onDismiss={() => setShowToast(false)}
      />
    </div>
  );
}
