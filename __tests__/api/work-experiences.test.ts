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

function makeSupabaseMock(overrides: {
  selectData?: unknown;
  insertData?: unknown;
  updateData?: unknown;
  deleteError?: null;
  error?: { message: string; code?: string } | null;
}) {
  const {
    selectData = [],
    insertData = null,
    updateData = null,
    deleteError = null,
    error = null,
  } = overrides;

  const chainMock = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  // Default single() resolves based on context
  chainMock.single.mockResolvedValue({ data: insertData ?? updateData, error });

  // from() returns the chain, but we track last call to determine data
  const fromMock = jest.fn().mockReturnValue(chainMock);

  // Override order().then to return list data
  chainMock.order.mockImplementation(() => ({
    then: (resolve: (v: { data: unknown; error: null }) => unknown) =>
      Promise.resolve({ data: selectData, error: null }).then(resolve),
  }));

  // delete chain end
  chainMock.eq.mockImplementation(() => ({
    then: (resolve: (v: { data: null; error: typeof deleteError }) => unknown) =>
      Promise.resolve({ data: null, error: deleteError }).then(resolve),
    single: jest.fn().mockResolvedValue({ data: updateData, error }),
  }));

  return { from: fromMock, chainMock };
}

// We need a simpler, more explicit mock approach
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

// Import after mocks are set up
import { GET, POST } from "@/app/api/work-experiences/route";
import {
  PUT,
  DELETE,
} from "@/app/api/work-experiences/[id]/route";

// Suppress unused import warning
void makeSupabaseMock;

describe("GET /api/work-experiences", () => {
  it("returns list of records with 200", async () => {
    const records = [
      { id: "1", title: "Engineer", company: "Acme", start_date: "2020-01-01" },
    ];
    buildClient("list", records);

    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(records);
  });
});

describe("POST /api/work-experiences", () => {
  it("creates record and returns 201", async () => {
    const created = {
      id: "abc",
      title: "Engineer",
      company: "Acme",
      start_date: "2020-01-01",
      is_current: false,
      description: [],
    };
    buildClient("insert", created);

    const req = makeRequest({
      title: "Engineer",
      company: "Acme",
      start_date: "2020-01-01",
    });

    const response = await POST(req);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toEqual(created);
  });

  it("returns 400 when required fields are missing", async () => {
    const req = makeRequest({ title: "Engineer" }); // missing company and start_date

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

describe("PUT /api/work-experiences/[id]", () => {
  it("updates record and returns 200 with updated data", async () => {
    const updated = {
      id: "abc",
      title: "Senior Engineer",
      company: "Acme",
      start_date: "2020-01-01",
    };
    buildClient("update", updated);

    const req = makeRequest({
      title: "Senior Engineer",
      company: "Acme",
      start_date: "2020-01-01",
    });

    const response = await PUT(req, {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(updated);
  });

  it("returns 404 when record not found", async () => {
    buildClient("notfound");

    const req = makeRequest({
      title: "Senior Engineer",
      company: "Acme",
      start_date: "2020-01-01",
    });

    const response = await PUT(req, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/work-experiences/[id]", () => {
  it("deletes record and returns 204", async () => {
    buildClient("delete");

    const response = await DELETE(makeRequest(), {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(response.status).toBe(204);
  });
});
