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

import { createServerClient } from "@supabase/ssr";

const mockCreateServerClient = createServerClient as jest.Mock;

function buildInsertClient(result: unknown) {
  const client = {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: result, error: null }),
        }),
      }),
    }),
  };
  mockCreateServerClient.mockReturnValue(client);
  return client;
}

function buildUpdateClient(result: unknown) {
  const client = {
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: result, error: null }),
          }),
        }),
      }),
    }),
  };
  mockCreateServerClient.mockReturnValue(client);
  return client;
}

function makeRequest(body?: unknown) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Request;
}

// Import after mocks are set up
import { POST } from "@/app/api/applications/route";
import { PATCH } from "@/app/api/applications/[id]/route";

describe("POST /api/applications", () => {
  it("rejects a status outside the known Kanban columns", async () => {
    const req = makeRequest({ company: "Acme", role: "Engineer", status: "Ghosted" });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/invalid status/i);
  });

  it("accepts a valid status", async () => {
    const created = { id: "a1", company: "Acme", role: "Engineer", status: "Applied" };
    buildInsertClient(created);

    const req = makeRequest({ company: "Acme", role: "Engineer", status: "Applied" });

    const response = await POST(req);
    expect(response.status).toBe(201);
  });
});

describe("PATCH /api/applications/[id]", () => {
  it("rejects a status outside the known Kanban columns", async () => {
    const req = makeRequest({ status: "Ghosted" });

    const response = await PATCH(req, { params: Promise.resolve({ id: "a1" }) });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/invalid status/i);
  });

  it("accepts a valid status transition", async () => {
    const updated = { id: "a1", status: "Interview" };
    buildUpdateClient(updated);

    const req = makeRequest({ status: "Interview" });

    const response = await PATCH(req, { params: Promise.resolve({ id: "a1" }) });
    expect(response.status).toBe(200);
  });
});
