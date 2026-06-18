import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_experiences")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !body.title || !body.company || !body.start_date) {
    return NextResponse.json({ error: "title, company, and start_date are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_experiences")
    .insert({
      title: body.title,
      company: body.company,
      location: body.location ?? null,
      start_date: body.start_date,
      end_date: body.end_date ?? null,
      is_current: body.is_current ?? false,
      description: body.description ?? [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
