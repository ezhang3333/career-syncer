"use client";

import { useState, useRef, useEffect } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { PortfolioConfig } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Shared small UI (mirrors career-data page style)
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

// ---------------------------------------------------------------------------
// Push Toast
// ---------------------------------------------------------------------------

function PushToast({
  state,
  onDismiss,
}: {
  state: "success" | "error" | null;
  message?: string;
  onDismiss: () => void;
}) {
  const toastRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useGSAP(
    () => {
      if (!toastRef.current) return;
      if (state) {
        gsap.fromTo(
          toastRef.current,
          { x: "110%", autoAlpha: 0 },
          { x: "0%", autoAlpha: 1, duration: 0.35, ease: "power3.out" },
        );
      }
    },
    { dependencies: [state], scope: toastRef },
  );

  useEffect(() => {
    if (!state) return;
    timerRef.current = setTimeout(() => dismiss(), 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function dismiss() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!toastRef.current) {
      onDismiss();
      return;
    }
    gsap.to(toastRef.current, {
      x: "110%",
      autoAlpha: 0,
      duration: 0.25,
      ease: "power3.in",
      onComplete: onDismiss,
    });
  }

  if (!state) return null;

  return (
    <div
      ref={toastRef}
      style={{ transform: "translateX(110%)" }}
      className="fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-lg border border-white/10 bg-[#111113] px-4 py-3 shadow-2xl max-w-sm"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90">
          {state === "success"
            ? "Career data pushed to GitHub successfully."
            : "Push failed — check your GitHub settings and try again."}
        </p>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 rounded p-0.5 text-white/40 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type FormState = Omit<PortfolioConfig, "id" | "created_at" | "updated_at">;

function defaultForm(): FormState {
  return {
    github_owner: "",
    github_repo: "",
    github_branch: "main",
    github_pat: "",
    file_path: "data/career-data.json",
  };
}

export default function PortfolioPage() {
  const [form, setForm] = useState<FormState>(defaultForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [toastState, setToastState] = useState<"success" | "error" | null>(null);

  // Refs for GSAP stagger entrance
  const containerRef = useRef<HTMLDivElement>(null);

  // Staggered entrance animation on form fields
  useGSAP(
    () => {
      const fields = containerRef.current?.querySelectorAll(".form-field");
      if (!fields || fields.length === 0) return;
      gsap.fromTo(
        fields,
        { autoAlpha: 0, y: 12 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.35,
          stagger: 0.07,
          ease: "power2.out",
        },
      );
    },
    { scope: containerRef, dependencies: [loading] },
  );

  // Load saved config on mount
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/portfolio/config");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setForm({
            github_owner: data.github_owner ?? "",
            github_repo: data.github_repo ?? "",
            github_branch: data.github_branch ?? "main",
            github_pat: data.github_pat ?? "",
            file_path: data.file_path ?? "data/career-data.json",
          });
        }
      }
      setLoading(false);
    })();
  }, []);

  function set(k: keyof FormState, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/portfolio/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
  }

  async function handlePush() {
    setPushing(true);
    const res = await fetch("/api/portfolio/push", { method: "POST" });
    setPushing(false);
    if (res.ok) {
      setToastState("success");
    } else {
      setToastState("error");
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio Push</h1>
        <p className="mt-1 text-sm text-white/40">
          Push your career data as JSON to a GitHub repository for use in a portfolio site.
        </p>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-white/30">Loading…</p>
        </div>
      ) : (
        <div ref={containerRef} className="max-w-lg">
          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div className="form-field">
              <Label>GitHub Owner *</Label>
              <Input
                value={form.github_owner}
                onChange={(e) => set("github_owner", e.target.value)}
                required
                placeholder="your-username"
              />
            </div>

            <div className="form-field">
              <Label>Repository Name *</Label>
              <Input
                value={form.github_repo}
                onChange={(e) => set("github_repo", e.target.value)}
                required
                placeholder="my-portfolio"
              />
            </div>

            <div className="form-field">
              <Label>Branch</Label>
              <Input
                value={form.github_branch}
                onChange={(e) => set("github_branch", e.target.value)}
                placeholder="main"
              />
            </div>

            <div className="form-field">
              <Label>Personal Access Token (PAT) *</Label>
              <Input
                type="password"
                value={form.github_pat}
                onChange={(e) => set("github_pat", e.target.value)}
                required
                placeholder="ghp_..."
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-white/30">
                Needs <code className="text-white/50">contents: write</code> permission on the repo.
              </p>
            </div>

            <div className="form-field">
              <Label>Output File Path</Label>
              <Input
                value={form.file_path}
                onChange={(e) => set("file_path", e.target.value)}
                placeholder="data/career-data.json"
              />
            </div>

            <div className="form-field flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : "Save Settings"}
              </button>

              <button
                type="button"
                onClick={handlePush}
                disabled={pushing || !form.github_owner || !form.github_repo || !form.github_pat}
                className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
              >
                {pushing ? "Pushing…" : "Push to GitHub"}
              </button>
            </div>
          </form>
        </div>
      )}

      <PushToast state={toastState} onDismiss={() => setToastState(null)} />
    </div>
  );
}
