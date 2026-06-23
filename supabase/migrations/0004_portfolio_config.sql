create table portfolio_config (
  id uuid primary key default gen_random_uuid(),
  github_owner text not null default '',
  github_repo text not null default '',
  github_branch text not null default 'main',
  github_pat text not null default '',
  file_path text not null default 'data/career-data.json',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
