// Maps career entity types to their API endpoints, target resume sections,
// and a normalized display shape used by the palette and canvas.

import type {
  Certification,
  Education,
  EntityType,
  Project,
  Skill,
  WorkExperience,
} from "@/lib/types/database";

export type SectionId =
  | "experience"
  | "projects"
  | "education"
  | "skills"
  | "certifications";

export interface PaletteItem {
  entityType: EntityType;
  entityId: string;
  section: SectionId;
  title: string;
  subtitle: string | null;
  badge: string;
}

interface EntityConfig {
  endpoint: string;
  section: SectionId;
  badge: string;
  toPalette: (record: unknown) => Omit<
    PaletteItem,
    "entityType" | "section" | "badge"
  >;
}

export const ENTITY_CONFIG: Record<EntityType, EntityConfig> = {
  work_experience: {
    endpoint: "/api/work-experiences",
    section: "experience",
    badge: "Experience",
    toPalette: (r) => {
      const w = r as WorkExperience;
      return { entityId: w.id, title: w.title, subtitle: w.company };
    },
  },
  project: {
    endpoint: "/api/projects",
    section: "projects",
    badge: "Project",
    toPalette: (r) => {
      const p = r as Project;
      return {
        entityId: p.id,
        title: p.name,
        subtitle: p.tech_stack.length ? p.tech_stack.join(", ") : null,
      };
    },
  },
  education: {
    endpoint: "/api/education",
    section: "education",
    badge: "Education",
    toPalette: (r) => {
      const e = r as Education;
      return { entityId: e.id, title: e.degree, subtitle: e.institution };
    },
  },
  skill: {
    endpoint: "/api/skills",
    section: "skills",
    badge: "Skill",
    toPalette: (r) => {
      const s = r as Skill;
      return { entityId: s.id, title: s.name, subtitle: s.category };
    },
  },
  certification: {
    endpoint: "/api/certifications",
    section: "certifications",
    badge: "Certification",
    toPalette: (r) => {
      const c = r as Certification;
      return { entityId: c.id, title: c.name, subtitle: c.issuer };
    },
  },
};

export const ENTITY_TYPES = Object.keys(ENTITY_CONFIG) as EntityType[];

// Fetch every career entity in parallel and flatten into palette items.
export async function fetchPaletteItems(): Promise<PaletteItem[]> {
  const results = await Promise.all(
    ENTITY_TYPES.map(async (entityType) => {
      const config = ENTITY_CONFIG[entityType];
      const res = await fetch(config.endpoint);
      if (!res.ok) return [] as PaletteItem[];
      const records = (await res.json()) as unknown[];
      return records.map((record) => {
        const base = config.toPalette(record);
        return {
          ...base,
          entityType,
          section: config.section,
          badge: config.badge,
        } satisfies PaletteItem;
      });
    }),
  );
  return results.flat();
}

export function paletteKey(entityType: EntityType, entityId: string): string {
  return `${entityType}:${entityId}`;
}
