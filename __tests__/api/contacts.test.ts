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

function buildUpdateClient(result: unknown, error: { message: string; code?: string } | null = null) {
  const updateMock = jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: result, error }),
      }),
    }),
  });

  const client = {
    from: jest.fn().mockReturnValue({ update: updateMock }),
  };

  mockCreateServerClient.mockReturnValue(client);
  return { client, updateMock };
}

function makeRequest(body?: unknown) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Request;
}

// Import after mocks are set up
import { PATCH } from "@/app/api/contacts/[id]/route";

describe("PATCH /api/contacts/[id]", () => {
  it("only updates the fields present in the request body", async () => {
    const updated = { id: "c1", name: "Ada Lovelace", company: "Acme" };
    const { updateMock } = buildUpdateClient(updated);

    const req = makeRequest({ last_contacted: "2026-07-02" });

    const response = await PATCH(req, { params: Promise.resolve({ id: "c1" }) });
    expect(response.status).toBe(200);

    const updatePayload = updateMock.mock.calls[0][0];
    expect(updatePayload).toEqual({ last_contacted: "2026-07-02" });
    expect(updatePayload).not.toHaveProperty("company");
    expect(updatePayload).not.toHaveProperty("name");
    expect(updatePayload).not.toHaveProperty("notes");
  });

  it("updates multiple provided fields without touching omitted ones", async () => {
    const updated = { id: "c1", name: "Ada Lovelace" };
    const { updateMock } = buildUpdateClient(updated);

    const req = makeRequest({ name: "Ada Lovelace", role: "Engineer" });

    await PATCH(req, { params: Promise.resolve({ id: "c1" }) });

    const updatePayload = updateMock.mock.calls[0][0];
    expect(updatePayload).toEqual({ name: "Ada Lovelace", role: "Engineer" });
  });

  it("returns 404 when record not found", async () => {
    buildUpdateClient(null, { code: "PGRST116", message: "not found" });

    const req = makeRequest({ notes: "followed up" });

    const response = await PATCH(req, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(response.status).toBe(404);
  });

  it("returns 400 when body is invalid JSON", async () => {
    const req = {
      json: jest.fn().mockResolvedValue(null),
    } as unknown as Request;

    const response = await PATCH(req, { params: Promise.resolve({ id: "c1" }) });
    expect(response.status).toBe(400);
  });
});
