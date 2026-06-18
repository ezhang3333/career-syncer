"use client";

// PDF layout components built with @react-pdf/renderer.
// This file must only be imported dynamically (no SSR) because the library
// is browser-only in Next.js.

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { PaletteItem } from "./careerData";
import type { DraftResumeItem } from "./resumeItemsState";
import { sectionItems } from "./resumeItemsState";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLabel(
  item: DraftResumeItem,
  palette: PaletteItem[],
): { title: string; subtitle: string | null } {
  const match = palette.find(
    (p) => p.entityType === item.entity_type && p.entityId === item.entity_id,
  );
  return { title: match?.title ?? "Unknown", subtitle: match?.subtitle ?? null };
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const shared = StyleSheet.create({
  page: { fontFamily: "Times-Roman", fontSize: 11, color: "#111111" },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    marginBottom: 12,
    paddingBottom: 8,
    alignItems: "center",
  },
  name: { fontSize: 20, fontFamily: "Times-Bold", marginBottom: 3 },
  contact: { fontSize: 9, color: "#555555" },
  sectionHeading: {
    fontSize: 10,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: "#aaaaaa",
    paddingBottom: 2,
    marginBottom: 5,
    marginTop: 10,
  },
  itemTitle: { fontSize: 11, fontFamily: "Times-Bold" },
  itemSubtitle: { fontSize: 9, color: "#555555", marginTop: 1 },
  item: { marginBottom: 5 },
});

// ---------------------------------------------------------------------------
// Section block used by both templates
// ---------------------------------------------------------------------------

function SectionBlock({
  label,
  items,
  palette,
}: {
  label: string;
  items: DraftResumeItem[];
  palette: PaletteItem[];
}) {
  if (items.length === 0) return null;
  return (
    <View>
      <Text style={shared.sectionHeading}>{label}</Text>
      {items.map((item, i) => {
        const { title, subtitle } = getLabel(item, palette);
        return (
          <View key={i} style={shared.item}>
            <Text style={shared.itemTitle}>{title}</Text>
            {subtitle && <Text style={shared.itemSubtitle}>{subtitle}</Text>}
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Classic PDF — single column
// ---------------------------------------------------------------------------

const classicStyles = StyleSheet.create({
  page: { ...shared.page, padding: 40 },
});

export function ClassicPDF({
  items,
  palette,
  resumeName,
}: {
  items: DraftResumeItem[];
  palette: PaletteItem[];
  resumeName: string;
}) {
  return (
    <Document title={resumeName}>
      <Page style={classicStyles.page}>
        <View style={shared.header}>
          <Text style={shared.name}>Your Name</Text>
          <Text style={shared.contact}>email · phone · location</Text>
        </View>
        <SectionBlock
          label="Experience"
          items={sectionItems(items, "experience")}
          palette={palette}
        />
        <SectionBlock
          label="Projects"
          items={sectionItems(items, "projects")}
          palette={palette}
        />
        <SectionBlock
          label="Education"
          items={sectionItems(items, "education")}
          palette={palette}
        />
        <SectionBlock
          label="Skills"
          items={sectionItems(items, "skills")}
          palette={palette}
        />
        <SectionBlock
          label="Certifications"
          items={sectionItems(items, "certifications")}
          palette={palette}
        />
      </Page>
    </Document>
  );
}

// ---------------------------------------------------------------------------
// Modern PDF — two columns
// ---------------------------------------------------------------------------

const modernStyles = StyleSheet.create({
  page: { ...shared.page, padding: 40 },
  row: { flexDirection: "row", gap: 20 },
  sidebar: {
    width: "30%",
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 4,
  },
  main: { flex: 1 },
  sideHeading: {
    fontSize: 9,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: "#aaaaaa",
    paddingBottom: 2,
    marginBottom: 5,
    marginTop: 8,
  },
});

export function ModernPDF({
  items,
  palette,
  resumeName,
}: {
  items: DraftResumeItem[];
  palette: PaletteItem[];
  resumeName: string;
}) {
  return (
    <Document title={resumeName}>
      <Page style={modernStyles.page}>
        <View style={shared.header}>
          <Text style={shared.name}>Your Name</Text>
          <Text style={shared.contact}>email · phone · location</Text>
        </View>
        <View style={modernStyles.row}>
          {/* Sidebar */}
          <View style={modernStyles.sidebar}>
            <SectionBlock
              label="Skills"
              items={sectionItems(items, "skills")}
              palette={palette}
            />
            <SectionBlock
              label="Education"
              items={sectionItems(items, "education")}
              palette={palette}
            />
            <SectionBlock
              label="Certifications"
              items={sectionItems(items, "certifications")}
              palette={palette}
            />
          </View>
          {/* Main column */}
          <View style={modernStyles.main}>
            <SectionBlock
              label="Experience"
              items={sectionItems(items, "experience")}
              palette={palette}
            />
            <SectionBlock
              label="Projects"
              items={sectionItems(items, "projects")}
              palette={palette}
            />
          </View>
        </View>
      </Page>
    </Document>
  );
}
