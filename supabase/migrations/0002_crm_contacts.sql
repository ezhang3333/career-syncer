-- 0002_crm_contacts.sql — Phase 2: networking CRM

create table contacts (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  company          text,
  category         text,        -- e.g. 'Tech', 'Government', 'Finance', 'Academia'
  role             text,
  how_met          text,
  notes            text,
  last_contacted   date,
  linkedin_url     text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create trigger trg_contacts_updated_at
  before update on contacts
  for each row execute function set_updated_at();
