import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("linkedin_profile")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data) {
    return NextResponse.json(data);
  }

  // No record yet — insert an empty one and return it
  const { data: created, error: insertError } = await supabase
    .from("linkedin_profile")
    .insert({})
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(created);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const body = await request.json() as { id?: string; headline?: string; summary?: string };

  const { id, headline, summary } = body;

  if (id) {
    const { data, error } = await supabase
      .from("linkedin_profile")
      .update({ headline: headline ?? null, summary: summary ?? null })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  // No id — upsert (insert first row)
  const { data, error } = await supabase
    .from("linkedin_profile")
    .insert({ headline: headline ?? null, summary: summary ?? null })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
