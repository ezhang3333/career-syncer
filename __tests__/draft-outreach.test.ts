// Mock next/server before any imports
jest.mock("next/server", () => {
  const actual = jest.requireActual("next/server") as typeof import("next/server");
  function NextResponse(_body: unknown, init?: ResponseInit) {
    return { status: init?.status ?? 200, json: async () => null };
  }
  NextResponse.json = (body: unknown, init?: ResponseInit) => ({
    status: init?.status ?? 200,
    json: async () => body,
  });
  return { ...actual, NextResponse };
});

// Mock next/headers
jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({
    getAll: jest.fn().mockReturnValue([]),
    set: jest.fn(),
  }),
}));

// Mock @supabase/ssr
jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

// NOTE: @anthropic-ai/sdk is resolved via moduleNameMapper in jest.config.ts
// pointing to __mocks__/@anthropic-ai/sdk.js. The package must be installed
// (`npm install`) before running in production, but tests use the stub.

import { createServerClient } from "@supabase/ssr";

const mockCreateServerClient = createServerClient as jest.Mock;

// Access the Anthropic mock via require so we get the module-level singleton
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: MockAnthropic } = require("@anthropic-ai/sdk") as {
  default: jest.Mock & { _mockCreate: jest.Mock };
};

function buildSupabaseClient(
  contact: Record<string, unknown> | null,
  dbError?: { code?: string; message?: string },
) {
  const client = {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: contact,
            error: dbError ?? null,
          }),
        }),
      }),
    }),
  };
  mockCreateServerClient.mockReturnValue(client);
  return client;
}

function makeRequest(body: unknown) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Request;
}

import { POST } from "@/app/api/contacts/[id]/draft-outreach/route";

const sampleContact = {
  id: "contact-1",
  name: "Jane Smith",
  company: "Acme Corp",
  role: "Software Engineer",
  category: "Tech",
  how_met: "Conference",
  notes: "Great conversation about distributed systems",
  last_contacted: "2024-06-01",
  linkedin_url: null,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
};

const MESSAGE_TYPES = ["cold", "followup", "linkedin-dm", "thank-you"] as const;

describe("POST /api/contacts/[id]/draft-outreach", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the shared mock to return a default text content block
    MockAnthropic._mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "Hello Jane, I wanted to reach out..." }],
    });
    // Wire new Anthropic instances to use the shared mock
    MockAnthropic.mockImplementation(() => ({
      messages: { create: MockAnthropic._mockCreate },
    }));
  });

  describe("returns 404 when contact not found", () => {
    it("returns 404 when Supabase returns PGRST116 error", async () => {
      buildSupabaseClient(null, { code: "PGRST116", message: "not found" });

      const req = makeRequest({ messageType: "cold" });
      const response = await POST(req, { params: Promise.resolve({ id: "missing" }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("returns 404 when contact data is null with no error", async () => {
      buildSupabaseClient(null, undefined);

      const req = makeRequest({ messageType: "cold" });
      const response = await POST(req, { params: Promise.resolve({ id: "missing" }) });

      expect(response.status).toBe(404);
    });
  });

  describe("returns the draft string from the Claude API response", () => {
    it("returns { draft } on success", async () => {
      buildSupabaseClient(sampleContact);
      const expectedDraft = "Hi Jane, I came across your profile...";
      MockAnthropic._mockCreate.mockResolvedValue({
        content: [{ type: "text", text: expectedDraft }],
      });

      const req = makeRequest({ messageType: "cold" });
      const response = await POST(req, { params: Promise.resolve({ id: "contact-1" }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.draft).toBe(expectedDraft);
    });
  });

  describe("passes contact fields to Claude for each message type", () => {
    MESSAGE_TYPES.forEach((messageType) => {
      it(`includes name, company, role, how_met, and notes for messageType="${messageType}"`, async () => {
        buildSupabaseClient(sampleContact);

        const req = makeRequest({ messageType });
        await POST(req, { params: Promise.resolve({ id: "contact-1" }) });

        expect(MockAnthropic._mockCreate).toHaveBeenCalledTimes(1);

        const callArgs = MockAnthropic._mockCreate.mock.calls[0][0] as {
          model: string;
          max_tokens: number;
          messages: Array<{ role: string; content: string }>;
        };

        // Verify model and token limit
        expect(callArgs.model).toBe("claude-sonnet-4-6");
        expect(callArgs.max_tokens).toBe(600);

        // Verify messages array has the user message
        expect(callArgs.messages).toHaveLength(1);
        const userContent = callArgs.messages[0].content;

        expect(userContent).toContain(sampleContact.name);
        expect(userContent).toContain(sampleContact.company);
        expect(userContent).toContain(sampleContact.role);
        expect(userContent).toContain(sampleContact.how_met);
        expect(userContent).toContain(sampleContact.notes);
      });
    });
  });

  describe("validation", () => {
    it("returns 400 for invalid messageType", async () => {
      buildSupabaseClient(sampleContact);

      const req = makeRequest({ messageType: "invalid-type" });
      const response = await POST(req, { params: Promise.resolve({ id: "contact-1" }) });

      expect(response.status).toBe(400);
    });

    it("returns 400 for missing messageType", async () => {
      buildSupabaseClient(sampleContact);

      const req = makeRequest({});
      const response = await POST(req, { params: Promise.resolve({ id: "contact-1" }) });

      expect(response.status).toBe(400);
    });

    it("returns 400 for invalid JSON body", async () => {
      buildSupabaseClient(sampleContact);

      const req = {
        json: jest.fn().mockRejectedValue(new SyntaxError("invalid json")),
      } as unknown as Request;

      const response = await POST(req, { params: Promise.resolve({ id: "contact-1" }) });
      expect(response.status).toBe(400);
    });
  });
});
