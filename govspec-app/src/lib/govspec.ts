import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Resolve the docs directory relative to the project root (one level up from govspec-app)
export function getDocsRoot(): string {
  return path.resolve(process.cwd(), "..", "docs");
}

export function getGovernancePath(): string {
  return path.join(getDocsRoot(), "governance");
}

export function getFeaturesPath(): string {
  return path.join(getDocsRoot(), "features");
}

// --- Types ---

export interface ParsedFeature {
  id: string;
  name: string;
  status: string;
  priority: string | null;
  dependsOn: string | null;
  requestedBy: string;
  requestedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  completedAt: string | null;
  relatedDocs: string | null;
  notes: string | null;
}

export interface FeatureDocument {
  filename: string;
  featureId: string;
  featureName: string;
  status: string;
  implementation: string;
  content: string;
  rawContent: string;
}

export interface GovernanceInfo {
  version: string;
  content: string;
}

// --- Feature Registry Parser ---

export function parseFeatureRegistry(): ParsedFeature[] {
  const registryPath = path.join(getGovernancePath(), "project_features.md");
  if (!fs.existsSync(registryPath)) return [];

  const content = fs.readFileSync(registryPath, "utf-8");
  const lines = content.split("\n");

  // Find the Feature Index table
  const headerIndex = lines.findIndex((line) =>
    line.includes("Feature ID") && line.includes("Feature Name") && line.includes("Status")
  );
  if (headerIndex === -1) return [];

  // Skip the separator line (|---|---|...)
  const dataStartIndex = headerIndex + 2;
  const features: ParsedFeature[] = [];

  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) break;

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c !== "");

    if (cells.length < 8) continue;

    const dash = (v: string) => (v === "—" || v === "-" || v === "" ? null : v);

    features.push({
      id: cells[0],
      name: cells[1],
      status: cells[2],
      priority: dash(cells[3]) || null,
      dependsOn: dash(cells[4]) || null,
      requestedBy: cells[5],
      requestedAt: cells[6],
      approvedAt: dash(cells[7]) || null,
      rejectedAt: dash(cells[8]) || null,
      completedAt: dash(cells[9]) || null,
      relatedDocs: dash(cells[10]) || null,
      notes: dash(cells[11]) || null,
    });
  }

  return features;
}

// --- Feature Document Parser ---

export function parseFeatureDocument(filename: string): FeatureDocument | null {
  const filePath = path.join(getFeaturesPath(), filename);
  if (!fs.existsSync(filePath)) return null;

  const rawContent = fs.readFileSync(filePath, "utf-8");
  const lines = rawContent.split("\n");

  // Extract status and implementation from the header lines
  let status = "unknown";
  let implementation = "unknown";
  let featureId = "";
  let featureName = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("STATUS:")) {
      status = trimmed.replace("STATUS:", "").trim();
    }
    if (trimmed.startsWith("IMPLEMENTATION:")) {
      implementation = trimmed.replace("IMPLEMENTATION:", "").trim();
    }
    if (trimmed.startsWith("- Feature ID:")) {
      featureId = trimmed.replace("- Feature ID:", "").trim();
    }
    if (trimmed.startsWith("- Feature Name:")) {
      featureName = trimmed.replace("- Feature Name:", "").trim();
    }
  }

  return {
    filename,
    featureId,
    featureName,
    status,
    implementation,
    content: rawContent,
    rawContent,
  };
}

export function listFeatureDocuments(): string[] {
  const featuresDir = getFeaturesPath();
  if (!fs.existsSync(featuresDir)) return [];

  return fs
    .readdirSync(featuresDir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_template"));
}

// --- Governance Info ---

export function getGovernanceInfo(): GovernanceInfo {
  const instrPath = path.join(getGovernancePath(), "project_development_instructions.md");
  if (!fs.existsSync(instrPath)) {
    return { version: "unknown", content: "" };
  }

  const content = fs.readFileSync(instrPath, "utf-8");
  const versionMatch = content.match(/## Version\s*\n\s*(v[\d.]+)/);
  const version = versionMatch ? versionMatch[1] : "unknown";

  return { version, content };
}

// --- Registry Writer ---

export function updateFeatureInRegistry(
  featureId: string,
  updates: Partial<ParsedFeature>
): void {
  const registryPath = path.join(getGovernancePath(), "project_features.md");
  const content = fs.readFileSync(registryPath, "utf-8");
  const lines = content.split("\n");

  const headerIndex = lines.findIndex(
    (line) => line.includes("Feature ID") && line.includes("Feature Name") && line.includes("Status")
  );
  if (headerIndex === -1) return;

  const dataStartIndex = headerIndex + 2;

  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) break;

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c !== "");

    if (cells[0] === featureId) {
      const dash = (v: string | null | undefined) => v || "—";
      const feature: ParsedFeature = {
        id: cells[0],
        name: updates.name || cells[1],
        status: updates.status || cells[2],
        priority: updates.priority !== undefined ? updates.priority : (cells[3] === "—" ? null : cells[3]),
        dependsOn: updates.dependsOn !== undefined ? updates.dependsOn : (cells[4] === "—" ? null : cells[4]),
        requestedBy: updates.requestedBy || cells[5],
        requestedAt: updates.requestedAt || cells[6],
        approvedAt: updates.approvedAt !== undefined ? updates.approvedAt : (cells[7] === "—" ? null : cells[7]),
        rejectedAt: updates.rejectedAt !== undefined ? updates.rejectedAt : (cells[8] === "—" ? null : cells[8]),
        completedAt: updates.completedAt !== undefined ? updates.completedAt : (cells[9] === "—" ? null : cells[9]),
        relatedDocs: updates.relatedDocs !== undefined ? updates.relatedDocs : (cells[10] === "—" ? null : cells[10]),
        notes: updates.notes !== undefined ? updates.notes : (cells[11] === "—" ? null : cells[11]),
      };

      lines[i] = `| ${feature.id} | ${feature.name} | ${feature.status} | ${dash(feature.priority)} | ${dash(feature.dependsOn)} | ${feature.requestedBy} | ${feature.requestedAt} | ${dash(feature.approvedAt)} | ${dash(feature.rejectedAt)} | ${dash(feature.completedAt)} | ${dash(feature.relatedDocs)} | ${dash(feature.notes)} |`;
      break;
    }
  }

  fs.writeFileSync(registryPath, lines.join("\n"), "utf-8");
}

// --- Feature Document Status Updater ---

export function updateFeatureDocStatus(filename: string, newStatus: string): void {
  const filePath = path.join(getFeaturesPath(), filename);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, "utf-8");

  // Update STATUS line
  content = content.replace(/^STATUS:\s*.+$/m, `STATUS: ${newStatus.toUpperCase()}`);

  // Update IMPLEMENTATION line
  const implAllowed = newStatus === "approved" ? "ALLOWED" : "FORBIDDEN";
  content = content.replace(/^IMPLEMENTATION:\s*.+$/m, `IMPLEMENTATION: ${implAllowed}`);

  fs.writeFileSync(filePath, content, "utf-8");
}

// --- Valid Status Transitions ---

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["pending", "rejected"],
  pending: ["approved", "rejected", "draft"],
  approved: ["completed", "rejected"],
  rejected: ["draft"],
  completed: [],
};

export function getValidTransitions(currentStatus: string): string[] {
  return VALID_TRANSITIONS[currentStatus.toLowerCase()] || [];
}

export function isValidTransition(from: string, to: string): boolean {
  const valid = VALID_TRANSITIONS[from.toLowerCase()];
  return valid ? valid.includes(to.toLowerCase()) : false;
}

// --- Next Feature ID ---

export function getNextFeatureId(): string {
  const features = parseFeatureRegistry();
  if (features.length === 0) return "01";

  const maxId = Math.max(...features.map((f) => parseInt(f.id, 10)));
  return String(maxId + 1).padStart(2, "0");
}
