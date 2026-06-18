import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ENTITY_TYPES = [
  "work_experience",
  "project",
  "education",
  "skill",
  "certification",
] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resume_items")
    .select("*")
    .eq("resume_id", id)
    .order("position", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (
    !body ||
    !ENTITY_TYPES.includes(body.entity_type) ||
    !body.entity_id ||
    !body.section
  ) {
    return NextResponse.json(
      { error: "entity_type, entity_id, and section are required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resume_items")
    .insert({
      resume_id: id,
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      section: body.section,
      position: body.position ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
