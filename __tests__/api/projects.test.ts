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

function buildClient(
  op: "list" | "insert" | "update" | "delete" | "notfound",
  payload?: unknown,
) {
  let client: Record<string, jest.Mock>;

  if (op === "list") {
    client = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: payload ?? [], error: null }),
        }),
      }),
    };
  } else if (op === "insert") {
    client = {
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: payload, error: null }),
          }),
        }),
      }),
    };
  } else if (op === "update") {
    client = {
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: payload, error: null }),
            }),
          }),
        }),
      }),
    };
  } else if (op === "notfound") {
    client = {
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: "PGRST116", message: "not found" },
              }),
            }),
          }),
        }),
      }),
    };
  } else {
    // delete
    client = {
      from: jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    };
  }

  mockCreateServerClient.mockReturnValue(client);
  return client;
}

function makeRequest(body?: unknown) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Request;
}

import { GET, POST } from "@/app/api/projects/route";
import { PUT, DELETE } from "@/app/api/projects/[id]/route";

describe("GET /api/projects", () => {
  it("returns list with 200", async () => {
    const records = [
      { id: "1", name: "My Project", tech_stack: ["React"], created_at: "2024-01-01" },
    ];
    buildClient("list", records);

    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(records);
  });
});

describe("POST /api/projects", () => {
  it("creates record and returns 201", async () => {
    const created = {
      id: "xyz",
      name: "My Project",
      tech_stack: ["React", "TypeScript"],
      description: null,
      url: null,
    };
    buildClient("insert", created);

    const req = makeRequest({
      name: "My Project",
      tech_stack: ["React", "TypeScript"],
    });

    const response = await POST(req);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toEqual(created);
  });

  it("returns 400 when name is missing", async () => {
    const req = makeRequest({ description: "A project" });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it("returns 400 when body is invalid JSON", async () => {
    const req = {
      json: jest.fn().mockRejectedValue(new SyntaxError("invalid json")),
    } as unknown as Request;

    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});

describe("PUT /api/projects/[id]", () => {
  it("returns updated record with 200", async () => {
    const updated = { id: "xyz", name: "Updated Project", tech_stack: [] };
    buildClient("update", updated);

    const req = makeRequest({ name: "Updated Project" });

    const response = await PUT(req, {
      params: Promise.resolve({ id: "xyz" }),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(updated);
  });

  it("returns 404 when not found", async () => {
    buildClient("notfound");

    const req = makeRequest({ name: "Nope" });

    const response = await PUT(req, {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/projects/[id]", () => {
  it("returns 204 on success", async () => {
    buildClient("delete");

    const req = makeRequest(undefined);
    const response = await DELETE(req, {
      params: Promise.resolve({ id: "xyz" }),
    });
    expect(response.status).toBe(204);
  });
});
