import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Resume } from "@/lib/types/database";
import { templateName, type TemplateId } from "@/lib/templates";
import ResumeEditor from "./ResumeEditor";

export default async function ResumeEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) notFound();
  const resume = data as Resume;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/resumes"
            className="text-xs text-white/40 hover:text-white transition-colors"
          >
            ← Resumes
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {resume.name}
          </h1>
          <p className="text-xs text-white/40">
            {templateName(resume.template_id)} template
          </p>
        </div>
      </div>

      <ResumeEditor
        resumeId={resume.id}
        resumeName={resume.name}
        templateId={resume.template_id as TemplateId}
      />
    </div>
  );
}
