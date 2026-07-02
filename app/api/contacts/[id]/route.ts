import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .update({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.company !== undefined && { company: body.company }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.role !== undefined && { role: body.role }),
      ...(body.how_met !== undefined && { how_met: body.how_met }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.last_contacted !== undefined && { last_contacted: body.last_contacted }),
      ...(body.linkedin_url !== undefined && { linkedin_url: body.linkedin_url }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error?.code === "PGRST116") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
