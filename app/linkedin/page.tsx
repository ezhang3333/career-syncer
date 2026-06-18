"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { createClient } from "@/lib/supabase/client";
import type { LinkedinProfile, WorkExperience, Education, Skill } from "@/lib/types/database";

export default function LinkedInPage() {
  const container = useRef<HTMLDivElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  const [profile, setProfile] = useState<LinkedinProfile | null>(null);
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  // Fetch all data on mount
  useEffect(() => {
    async function load() {
      // Profile
      const profileRes = await fetch("/api/linkedin-profile");
      if (profileRes.ok) {
        const p: LinkedinProfile = await profileRes.json();
        setProfile(p);
        setHeadline(p.headline ?? "");
        setSummary(p.summary ?? "");
      }

      // Work experiences, education, skills via Supabase browser client
      const supabase = createClient();

      const { data: expData } = await supabase
        .from("work_experiences")
        .select("*")
        .order("start_date", { ascending: false });
      if (expData) setExperiences(expData as WorkExperience[]);

      const { data: eduData } = await supabase
        .from("education")
        .select("*")
        .order("start_date", { ascending: false });
      if (eduData) setEducation(eduData as Education[]);

      const { data: skillData } = await supabase
        .from("skills")
        .select("*")
        .order("category", { ascending: true });
      if (skillData) setSkills(skillData as Skill[]);
    }

    load();
  }, []);

  // Section entrance animations — run once data is loaded
  useGSAP(
    () => {
      gsap.fromTo(
        ".linkedin-section",
        { autoAlpha: 0, y: 16 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
          stagger: 0.12,
        },
      );
    },
    { scope: container, dependencies: [profile] },
  );

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setSaved(false);

    const res = await fetch("/api/linkedin-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: profile.id, headline, summary }),
    });

    setSaving(false);

    if (res.ok) {
      const updated: LinkedinProfile = await res.json();
      setProfile(updated);
      setSaved(true);
      // Scale pulse on save button
      if (saveButtonRef.current) {
        gsap.fromTo(
          saveButtonRef.current,
          { scale: 1 },
          { scale: 1.08, duration: 0.12, ease: "power1.out", yoyo: true, repeat: 1 },
        );
      }
      setTimeout(() => setSaved(false), 3000);
    }
  }

  // Group skills by category
  const skillsByCategory = skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    const cat = skill.category ?? "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  function formatDateRange(start: string | null, end: string | null, isCurrent?: boolean): string {
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const startStr = start ? fmt(start) : "";
    const endStr = isCurrent ? "Present" : end ? fmt(end) : "Present";
    return startStr ? `${startStr} – ${endStr}` : endStr;
  }

  return (
    <div ref={container} className="flex flex-col gap-10">
      {/* Banner */}
      <div className="linkedin-section rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300/80">
        This data is not synced automatically — update LinkedIn manually after making changes.
      </div>

      {/* Profile form */}
      <section className="linkedin-section flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Profile</h2>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-white/60" htmlFor="headline">
              Headline
            </label>
            <input
              id="headline"
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Software Engineer at Acme"
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-white/60" htmlFor="summary">
              Summary
            </label>
            <textarea
              id="summary"
              rows={6}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Write a brief summary about yourself..."
              className="resize-none rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              ref={saveButtonRef}
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {saved && (
              <span className="text-sm text-green-400">Saved</span>
            )}
          </div>
        </div>
      </section>

      {/* Experience */}
      <section className="linkedin-section flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Experience</h2>
        {experiences.length === 0 ? (
          <p className="text-sm text-white/40">No work experience added yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-white/10">
            {experiences.map((exp) => (
              <div key={exp.id} className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0">
                <span className="font-medium">{exp.title}</span>
                <span className="text-sm text-white/70">
                  {exp.company}
                  {exp.location ? ` · ${exp.location}` : ""}
                </span>
                <span className="text-xs text-white/40">
                  {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                </span>
                {exp.description.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1 text-sm text-white/60">
                    {exp.description.map((line, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-0.5 shrink-0 text-white/30">•</span>
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Education */}
      <section className="linkedin-section flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Education</h2>
        {education.length === 0 ? (
          <p className="text-sm text-white/40">No education added yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-white/10">
            {education.map((edu) => (
              <div key={edu.id} className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0">
                <span className="font-medium">{edu.institution}</span>
                <span className="text-sm text-white/70">
                  {edu.degree}
                  {edu.field_of_study ? `, ${edu.field_of_study}` : ""}
                </span>
                <span className="text-xs text-white/40">
                  {formatDateRange(edu.start_date, edu.end_date)}
                </span>
                {edu.gpa !== null && (
                  <span className="text-xs text-white/40">GPA: {edu.gpa}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Skills */}
      <section className="linkedin-section flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Skills</h2>
        {skills.length === 0 ? (
          <p className="text-sm text-white/40">No skills added yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(skillsByCategory).map(([category, items]) => (
              <div key={category} className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white/60">{category}</span>
                <div className="flex flex-wrap gap-2">
                  {items.map((skill) => (
                    <span
                      key={skill.id}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
