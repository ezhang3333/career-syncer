import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portfolio_config")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json(null);

  // Never send the PAT back to the client — it round-trips through the
  // browser otherwise and shows up in the network tab / devtools.
  const { github_pat, ...rest } = data;
  return NextResponse.json({ ...rest, has_pat: !!github_pat });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch the existing row (if any) for the upsert. We need the current PAT
  // too, since the client never has it and shouldn't send it back to us.
  const { data: existing } = await supabase
    .from("portfolio_config")
    .select("id, github_pat")
    .limit(1)
    .maybeSingle();

  const payload = {
    ...(existing?.id ? { id: existing.id } : {}),
    github_owner: body.github_owner ?? "",
    github_repo: body.github_repo ?? "",
    github_branch: body.github_branch ?? "main",
    // An empty/omitted PAT means "keep the existing one" — only overwrite
    // when the client explicitly submits a new, non-empty token.
    github_pat: body.github_pat ? body.github_pat : (existing?.github_pat ?? ""),
    file_path: body.file_path ?? "data/career-data.json",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("portfolio_config")
    .upsert(payload)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
