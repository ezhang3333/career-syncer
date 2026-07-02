import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { APPLICATION_STATUSES } from "@/lib/types/database";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  if (body.status !== undefined && !APPLICATION_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_applications")
    .update({
      ...(body.company !== undefined && { company: body.company }),
      ...(body.role !== undefined && { role: body.role }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.applied_at !== undefined && { applied_at: body.applied_at }),
      ...(body.url !== undefined && { url: body.url }),
      ...(body.notes !== undefined && { notes: body.notes }),
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
  const { error } = await supabase.from("job_applications").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
