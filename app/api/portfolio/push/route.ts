import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();

  // 1. Read portfolio config
  const { data: config, error: configError } = await supabase
    .from("portfolio_config")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (configError) {
    return NextResponse.json({ error: configError.message }, { status: 500 });
  }
  if (!config) {
    return NextResponse.json({ error: "Portfolio config not found. Please save your GitHub settings first." }, { status: 400 });
  }

  const { github_owner, github_repo, github_branch, github_pat, file_path } = config;

  if (!github_owner || !github_repo || !github_pat) {
    return NextResponse.json({ error: "GitHub owner, repo, and PAT are required." }, { status: 400 });
  }

  // 2. Read all career data in parallel
  const [
    { data: work_experiences },
    { data: projects },
    { data: education },
    { data: skills },
    { data: certifications },
  ] = await Promise.all([
    supabase.from("work_experiences").select("*").order("start_date", { ascending: false }),
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("education").select("*").order("start_date", { ascending: false }),
    supabase.from("skills").select("*").order("name", { ascending: true }),
    supabase.from("certifications").select("*").order("issue_date", { ascending: false }),
  ]);

  // 3. Serialize to JSON
  const careerData = {
    work_experiences: work_experiences ?? [],
    projects: projects ?? [],
    education: education ?? [],
    skills: skills ?? [],
    certifications: certifications ?? [],
  };

  const jsonContent = JSON.stringify(careerData, null, 2);
  const base64Content = Buffer.from(jsonContent, "utf-8").toString("base64");

  // 4. Fetch current file SHA from GitHub (404 means new file)
  const contentsUrl = `https://api.github.com/repos/${github_owner}/${github_repo}/contents/${file_path}?ref=${github_branch}`;

  let existingSha: string | undefined;
  const shaResponse = await fetch(contentsUrl, {
    headers: {
      Authorization: `Bearer ${github_pat}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (shaResponse.ok) {
    const shaData = await shaResponse.json() as { sha?: string };
    existingSha = shaData.sha;
  } else if (shaResponse.status !== 404) {
    const errorText = await shaResponse.text();
    return NextResponse.json(
      { error: `GitHub API error fetching file: ${errorText}` },
      { status: 500 },
    );
  }

  // 5. Create or update file on GitHub
  const putUrl = `https://api.github.com/repos/${github_owner}/${github_repo}/contents/${file_path}`;
  const putBody: Record<string, unknown> = {
    message: "Update career data",
    content: base64Content,
    branch: github_branch,
  };
  if (existingSha) {
    putBody.sha = existingSha;
  }

  const putResponse = await fetch(putUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${github_pat}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(putBody),
  });

  if (!putResponse.ok) {
    const errorText = await putResponse.text();
    return NextResponse.json(
      { error: `GitHub API error pushing file: ${errorText}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
