import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_TEMPLATES = ["classic", "modern"];

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !body.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!body.template_id || !VALID_TEMPLATES.includes(body.template_id)) {
    return NextResponse.json(
      { error: "template_id must be 'classic' or 'modern'" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resumes")
    .insert({
      name: body.name,
      template_id: body.template_id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
