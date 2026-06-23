import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
// @ts-expect-error - package not yet installed; run `npm install` first
import Anthropic from "@anthropic-ai/sdk";

type MessageType = "cold" | "followup" | "linkedin-dm" | "thank-you";

const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  cold: "Cold Outreach",
  followup: "Follow-Up",
  "linkedin-dm": "LinkedIn DM",
  "thank-you": "Thank-You",
};

const SYSTEM_PROMPT =
  "You are helping draft a professional outreach message for a job seeker. " +
  "Write in a warm, authentic tone. Output only the message body — no subject line, no greeting label, no sign-off label.";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Parse request body
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messageType } = body as { messageType?: MessageType };
  if (!messageType || !MESSAGE_TYPE_LABELS[messageType]) {
    return NextResponse.json(
      { error: "messageType must be one of: cold, followup, linkedin-dm, thank-you" },
      { status: 400 },
    );
  }

  // Fetch contact from Supabase
  const supabase = await createClient();
  const { data: contact, error: dbError } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .single();

  if (dbError?.code === "PGRST116" || !contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Build user message
  const label = MESSAGE_TYPE_LABELS[messageType];
  const userMessage = `Draft a ${label} message to the following contact:
Name: ${contact.name}
Company: ${contact.company ?? "Not specified"}
Role: ${contact.role ?? "Not specified"}
Category: ${contact.category ?? "Not specified"}
How we met: ${contact.how_met ?? "Not specified"}
Notes: ${contact.notes ?? "None"}
Last contacted: ${contact.last_contacted ?? "Never"}`;

  // Call Claude API
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const draft =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ draft });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate draft";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
