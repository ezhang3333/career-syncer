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
