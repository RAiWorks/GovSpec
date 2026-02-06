import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncFromMarkdown } from "@/lib/sync";
import {
  getNextFeatureId,
  updateFeatureInRegistry,
  getFeaturesPath,
} from "@/lib/govspec";
import fs from "fs";
import path from "path";

// GET /api/features — list all features (syncs from markdown first)
export async function GET() {
  try {
    await syncFromMarkdown();
    const features = await prisma.feature.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json(features);
  } catch (error) {
    console.error("Failed to fetch features:", error);
    return NextResponse.json(
      { error: "Failed to fetch features" },
      { status: 500 }
    );
  }
}

// POST /api/features — create a new draft feature
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, purpose, motivation, priority, notes } = body;

    if (!name || !purpose) {
      return NextResponse.json(
        { error: "Name and purpose are required" },
        { status: 400 }
      );
    }

    const featureId = getNextFeatureId();
    const today = new Date().toISOString().split("T")[0];
    const filename = `${featureId}_${name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}.md`;

    // Read the minimal template
    const templatePath = path.join(getFeaturesPath(), "_template_minimal_feature.md");
    let template = fs.readFileSync(templatePath, "utf-8");

    // Fill in the template
    template = template.replace("[NN]", featureId);
    template = template.replace("[Name]", name);
    template = template.replace(
      "`docs/features/NN_feature_name.md`",
      `\`docs/features/${filename}\``
    );
    template = template.replace(
      "[version of project_development_instructions.md at time of creation]",
      "v2.0"
    );
    template = template.replace("[Project Owner / AI Project Contributor]", "Project Owner");
    template = template.replace("[YYYY-MM-DD]", today);
    template = template.replace(
      "Describe the problem this feature intends to solve. Be specific about the pain point or gap.",
      purpose
    );
    template = template.replace(
      "Explain why this feature is needed and what value it provides. What happens if this feature is not built?",
      motivation || "To be defined."
    );

    // Write the feature document
    const featureDocPath = path.join(getFeaturesPath(), filename);
    fs.writeFileSync(featureDocPath, template, "utf-8");

    // Add to the registry
    const registryPath = path.join(
      getFeaturesPath(),
      "..",
      "governance",
      "project_features.md"
    );
    const registryContent = fs.readFileSync(registryPath, "utf-8");

    const newRow = `| ${featureId} | ${name} | draft | ${priority || "normal"} | — | Project Owner | ${today} | — | — | — | \`docs/features/${filename}\` | ${notes || "—"} |`;

    // Insert the new row after the last table row or after the separator
    const lines = registryContent.split("\n");
    const headerIndex = lines.findIndex(
      (line) =>
        line.includes("Feature ID") &&
        line.includes("Feature Name") &&
        line.includes("Status")
    );

    if (headerIndex !== -1) {
      // Find the last row of the table
      let lastRowIndex = headerIndex + 2; // after header + separator
      for (let i = lastRowIndex; i < lines.length; i++) {
        if (lines[i].trim().startsWith("|")) {
          lastRowIndex = i + 1;
        } else {
          break;
        }
      }
      lines.splice(lastRowIndex, 0, newRow);
      fs.writeFileSync(registryPath, lines.join("\n"), "utf-8");
    }

    // Sync to DB
    await syncFromMarkdown();

    // Create audit log
    await prisma.auditLog.create({
      data: {
        featureId,
        fromStatus: null,
        toStatus: "draft",
        changedBy: "Project Owner",
        reason: "New feature created",
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        featureId,
        type: "new_draft",
        title: `New Feature: ${name}`,
        message: `Feature ${featureId} "${name}" has been created as a draft.`,
      },
    });

    const feature = await prisma.feature.findUnique({ where: { id: featureId } });
    return NextResponse.json(feature, { status: 201 });
  } catch (error) {
    console.error("Failed to create feature:", error);
    return NextResponse.json(
      { error: "Failed to create feature" },
      { status: 500 }
    );
  }
}
