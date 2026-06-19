import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("application_contacts")
    .select("contact:contacts(*)")
    .eq("application_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const contacts = (data ?? []).map((r) => (r as { contact: unknown }).contact);
  return NextResponse.json(contacts);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.contact_id) {
    return NextResponse.json({ error: "contact_id is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("application_contacts")
    .insert({ application_id: id, contact_id: body.contact_id });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.contact_id) {
    return NextResponse.json({ error: "contact_id is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("application_contacts")
    .delete()
    .eq("application_id", id)
    .eq("contact_id", body.contact_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
