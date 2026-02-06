import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncFromMarkdown } from "@/lib/sync";
import {
  parseFeatureDocument,
  listFeatureDocuments,
} from "@/lib/govspec";

// GET /api/features/[id] — get a single feature with its document content
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await syncFromMarkdown();

    const feature = await prisma.feature.findUnique({
      where: { id },
    });

    if (!feature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    // Find and parse the feature document
    const docs = listFeatureDocuments();
    const docFilename = docs.find((d) => d.startsWith(`${id}_`));
    let document = null;

    if (docFilename) {
      document = parseFeatureDocument(docFilename);
    }

    // Get audit logs for this feature
    const auditLogs = await prisma.auditLog.findMany({
      where: { featureId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ feature, document, auditLogs });
  } catch (error) {
    console.error("Failed to fetch feature:", error);
    return NextResponse.json(
      { error: "Failed to fetch feature" },
      { status: 500 }
    );
  }
}
