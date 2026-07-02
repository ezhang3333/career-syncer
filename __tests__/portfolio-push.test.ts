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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sampleConfig = {
  id: "cfg-1",
  github_owner: "testuser",
  github_repo: "my-portfolio",
  github_branch: "main",
  github_pat: "ghp_testtoken",
  file_path: "data/career-data.json",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const sampleCareerData = {
  work_experiences: [{ id: "w1", title: "Engineer", company: "Acme" }],
  projects: [],
  education: [],
  skills: [],
  certifications: [],
};

function buildPushClient(config: typeof sampleConfig | null, careerData = sampleCareerData) {
  const selectChain = (returnValue: unknown) => ({
    select: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({ data: returnValue, error: null }),
      }),
      order: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  });

  const fromImpl = jest.fn((table: string) => {
    if (table === "portfolio_config") {
      return selectChain(config);
    }
    // Career data tables
    const tableKey = table as keyof typeof careerData;
    const rows = careerData[tableKey] ?? [];
    return {
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: rows, error: null }),
      }),
    };
  });

  const client = { from: fromImpl };
  mockCreateServerClient.mockReturnValue(client);
  return client;
}

function buildConfigClient(
  op: "get" | "upsert",
  existing: { id: string; github_pat?: string } | null = null,
  result: unknown = sampleConfig,
) {
  let client: Record<string, jest.Mock>;

  if (op === "get") {
    client = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: result, error: null }),
          }),
        }),
      }),
    };
  } else {
    // upsert
    client = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: existing, error: null }),
          }),
        }),
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: result, error: null }),
          }),
        }),
      }),
    };
  }

  mockCreateServerClient.mockReturnValue(client);
  return client;
}

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { GET, PUT } from "@/app/api/portfolio/config/route";
import { POST } from "@/app/api/portfolio/push/route";

// ---------------------------------------------------------------------------
// GET /api/portfolio/config
// ---------------------------------------------------------------------------

describe("GET /api/portfolio/config", () => {
  it("returns config with 200, without the raw PAT", async () => {
    buildConfigClient("get", null, sampleConfig);

    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.github_pat).toBeUndefined();
    expect(data.has_pat).toBe(true);
    expect(data).toMatchObject({
      github_owner: sampleConfig.github_owner,
      github_repo: sampleConfig.github_repo,
    });
  });

  it("returns null when no config exists", async () => {
    buildConfigClient("get", null, null);

    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// PUT /api/portfolio/config
// ---------------------------------------------------------------------------

describe("PUT /api/portfolio/config", () => {
  function makeRequest(body: unknown) {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as Request;
  }

  it("upserts config and returns 200", async () => {
    buildConfigClient("upsert", { id: "cfg-1" }, sampleConfig);

    const req = makeRequest({
      github_owner: "testuser",
      github_repo: "my-portfolio",
      github_branch: "main",
      github_pat: "ghp_testtoken",
      file_path: "data/career-data.json",
    });

    const response = await PUT(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(sampleConfig);
  });

  it("returns 400 for invalid body", async () => {
    const req = {
      json: jest.fn().mockRejectedValue(new SyntaxError("bad json")),
    } as unknown as Request;

    const response = await PUT(req);
    expect(response.status).toBe(400);
  });

  it("preserves the existing PAT when none is submitted", async () => {
    const client = buildConfigClient(
      "upsert",
      { id: "cfg-1", github_pat: "ghp_existingtoken" },
      sampleConfig,
    );

    const req = makeRequest({
      github_owner: "testuser",
      github_repo: "my-portfolio",
      github_branch: "main",
      github_pat: "",
      file_path: "data/career-data.json",
    });

    const response = await PUT(req);
    expect(response.status).toBe(200);

    const tableClient = client.from.mock.results[0].value;
    const upsertCall = tableClient.upsert.mock.calls[0][0];
    expect(upsertCall.github_pat).toBe("ghp_existingtoken");
  });

  it("overwrites the PAT when a new one is submitted", async () => {
    const client = buildConfigClient(
      "upsert",
      { id: "cfg-1", github_pat: "ghp_existingtoken" },
      sampleConfig,
    );

    const req = makeRequest({
      github_owner: "testuser",
      github_repo: "my-portfolio",
      github_branch: "main",
      github_pat: "ghp_newtoken",
      file_path: "data/career-data.json",
    });

    await PUT(req);

    const tableClient = client.from.mock.results[0].value;
    const upsertCall = tableClient.upsert.mock.calls[0][0];
    expect(upsertCall.github_pat).toBe("ghp_newtoken");
  });
});

// ---------------------------------------------------------------------------
// POST /api/portfolio/push
// ---------------------------------------------------------------------------

describe("POST /api/portfolio/push", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns 400 when no config exists", async () => {
    buildPushClient(null);

    const response = await POST();
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/config not found/i);
  });

  it("creates file when it does not exist (no sha)", async () => {
    buildPushClient(sampleConfig);

    // GitHub GET → 404 (file does not exist)
    // GitHub PUT → 201 success
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      .mockResolvedValueOnce({ ok: true } as Response);

    global.fetch = mockFetch;

    const response = await POST();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify the PUT call has no sha
    const putCall = mockFetch.mock.calls[1];
    const putBody = JSON.parse(putCall[1].body as string);
    expect(putBody.sha).toBeUndefined();

    // Verify Authorization header
    expect(putCall[1].headers["Authorization"]).toBe("Bearer ghp_testtoken");

    // Verify base64 content is valid JSON
    const decoded = Buffer.from(putBody.content, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    expect(parsed).toHaveProperty("work_experiences");
    expect(parsed.work_experiences).toEqual(sampleCareerData.work_experiences);
  });

  it("includes sha when file already exists", async () => {
    buildPushClient(sampleConfig);

    const existingSha = "abc123sha";

    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sha: existingSha }),
      } as unknown as Response)
      .mockResolvedValueOnce({ ok: true } as Response);

    global.fetch = mockFetch;

    const response = await POST();
    expect(response.status).toBe(200);

    const putCall = mockFetch.mock.calls[1];
    const putBody = JSON.parse(putCall[1].body as string);
    expect(putBody.sha).toBe(existingSha);
  });

  it("returns 500 when GitHub PUT fails", async () => {
    buildPushClient(sampleConfig);

    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      .mockResolvedValueOnce({
        ok: false,
        text: async () => "Unauthorized",
      } as unknown as Response);

    global.fetch = mockFetch;

    const response = await POST();
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toMatch(/GitHub API error pushing/i);
  });

  it("uses correct branch in GET and PUT requests", async () => {
    const customConfig = { ...sampleConfig, github_branch: "gh-pages" };
    buildPushClient(customConfig);

    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      .mockResolvedValueOnce({ ok: true } as Response);

    global.fetch = mockFetch;

    await POST();

    // GET should include ref=gh-pages
    const getUrl = mockFetch.mock.calls[0][0] as string;
    expect(getUrl).toContain("ref=gh-pages");

    // PUT body should have branch: gh-pages
    const putBody = JSON.parse(mockFetch.mock.calls[1][1].body as string);
    expect(putBody.branch).toBe("gh-pages");
  });
});
