// Auto-derived from supabase/migrations/0001_initial_schema.sql
// Nullable columns use `null`, never `undefined`.

export type EntityType =
  | 'work_experience'
  | 'project'
  | 'education'
  | 'skill'
  | 'certification';

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string[];
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  tech_stack: string[];
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  gpa: number | null;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string | null;
  proficiency_level: string | null;
  created_at: string;
  updated_at: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  name: string;
  template_id: string;
  created_at: string;
  updated_at: string;
}

export interface ResumeItem {
  id: string;
  resume_id: string;
  entity_type: EntityType;
  entity_id: string;
  position: number;
  section: string;
  created_at: string;
}

export interface LinkedinProfile {
  id: string;
  headline: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  name: string;
  company: string | null;
  category: string | null;
  role: string | null;
  how_met: string | null;
  notes: string | null;
  last_contacted: string | null;
  linkedin_url: string | null;
  created_at: string;
  updated_at: string;
}

export const APPLICATION_STATUSES = [
  "Wishlist",
  "Applied",
  "Phone Screen",
  "Interview",
  "Offer",
  "Rejected",
  "Archived",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  applied_at: string | null;
  url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contacts?: Contact[];
}

export interface PortfolioConfig {
  id: string;
  github_owner: string;
  github_repo: string;
  github_branch: string;
  github_pat: string;
  file_path: string;
  created_at: string;
  updated_at: string;
}
