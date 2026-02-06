import { prisma } from "./prisma";
import {
  parseFeatureRegistry,
  listFeatureDocuments,
  getGovernanceInfo,
} from "./govspec";

export async function syncFromMarkdown(): Promise<{
  featuresSync: number;
  governanceVersion: string;
}> {
  const features = parseFeatureRegistry();
  const govInfo = getGovernanceInfo();

  // Upsert each feature from the registry into SQLite
  let synced = 0;
  for (const f of features) {
    await prisma.feature.upsert({
      where: { id: f.id },
      update: {
        name: f.name,
        status: f.status.toLowerCase(),
        priority: f.priority?.toLowerCase() || null,
        dependsOn: f.dependsOn,
        requestedBy: f.requestedBy,
        requestedAt: new Date(f.requestedAt),
        approvedAt: f.approvedAt ? new Date(f.approvedAt) : null,
        rejectedAt: f.rejectedAt ? new Date(f.rejectedAt) : null,
        completedAt: f.completedAt ? new Date(f.completedAt) : null,
        relatedDocs: f.relatedDocs,
        notes: f.notes,
      },
      create: {
        id: f.id,
        name: f.name,
        status: f.status.toLowerCase(),
        priority: f.priority?.toLowerCase() || null,
        dependsOn: f.dependsOn,
        requestedBy: f.requestedBy,
        requestedAt: new Date(f.requestedAt),
        approvedAt: f.approvedAt ? new Date(f.approvedAt) : null,
        rejectedAt: f.rejectedAt ? new Date(f.rejectedAt) : null,
        completedAt: f.completedAt ? new Date(f.completedAt) : null,
        relatedDocs: f.relatedDocs,
        notes: f.notes,
      },
    });
    synced++;
  }

  // Remove features from DB that are no longer in the registry
  const registryIds = features.map((f) => f.id);
  const dbFeatures = await prisma.feature.findMany({ select: { id: true } });
  for (const dbf of dbFeatures) {
    if (!registryIds.includes(dbf.id)) {
      await prisma.auditLog.deleteMany({ where: { featureId: dbf.id } });
      await prisma.notification.deleteMany({ where: { featureId: dbf.id } });
      await prisma.feature.delete({ where: { id: dbf.id } });
    }
  }

  // Store governance version
  await prisma.govSpecMeta.upsert({
    where: { key: "governance_version" },
    update: { value: govInfo.version },
    create: { key: "governance_version", value: govInfo.version },
  });

  return { featuresSync: synced, governanceVersion: govInfo.version };
}
