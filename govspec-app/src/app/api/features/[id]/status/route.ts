import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncFromMarkdown } from "@/lib/sync";
import {
  isValidTransition,
  getValidTransitions,
  updateFeatureInRegistry,
  updateFeatureDocStatus,
  listFeatureDocuments,
} from "@/lib/govspec";

// PUT /api/features/[id]/status — change feature status
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { newStatus, reason } = body;

    if (!newStatus) {
      return NextResponse.json(
        { error: "newStatus is required" },
        { status: 400 }
      );
    }

    // Get current feature
    await syncFromMarkdown();
    const feature = await prisma.feature.findUnique({ where: { id } });

    if (!feature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    const currentStatus = feature.status;

    // Validate transition
    if (!isValidTransition(currentStatus, newStatus)) {
      const valid = getValidTransitions(currentStatus);
      return NextResponse.json(
        {
          error: `Invalid transition from "${currentStatus}" to "${newStatus}". Valid transitions: ${valid.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Require reason for rejection
    if (newStatus === "rejected" && !reason) {
      return NextResponse.json(
        { error: "A reason is required when rejecting a feature" },
        { status: 400 }
      );
    }

    // Check dependencies for approved → completed
    if (newStatus === "completed" && feature.dependsOn) {
      const depIds = feature.dependsOn.split(",").map((d) => d.trim());
      const deps = await prisma.feature.findMany({
        where: { id: { in: depIds } },
      });
      const unmet = deps.filter((d) => d.status !== "completed");
      if (unmet.length > 0) {
        return NextResponse.json(
          {
            error: `Cannot complete: dependencies not met. Unmet: ${unmet.map((d) => `${d.id} (${d.status})`).join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    const today = new Date().toISOString().split("T")[0];

    // Build registry updates
    const registryUpdates: Record<string, string | null> = {
      status: newStatus,
    };

    if (newStatus === "approved") {
      registryUpdates.approvedAt = today;
    } else if (newStatus === "rejected") {
      registryUpdates.rejectedAt = today;
    } else if (newStatus === "completed") {
      registryUpdates.completedAt = today;
    }

    // If reopening from rejected, clear rejection date
    if (currentStatus === "rejected" && newStatus === "draft") {
      registryUpdates.rejectedAt = "—";
    }

    // Update the markdown registry
    updateFeatureInRegistry(id, registryUpdates as any);

    // Update the feature document status line
    const docs = listFeatureDocuments();
    const docFilename = docs.find((d) => d.startsWith(`${id}_`));
    if (docFilename) {
      updateFeatureDocStatus(docFilename, newStatus);
    }

    // Sync DB from updated markdown
    await syncFromMarkdown();

    // Create audit log
    await prisma.auditLog.create({
      data: {
        featureId: id,
        fromStatus: currentStatus,
        toStatus: newStatus,
        changedBy: "Project Owner",
        reason: reason || null,
      },
    });

    // Create notification
    const notifTypes: Record<string, string> = {
      pending: "pending_review",
      approved: "status_change",
      rejected: "status_change",
      completed: "status_change",
      draft: "status_change",
    };

    await prisma.notification.create({
      data: {
        featureId: id,
        type: notifTypes[newStatus] || "status_change",
        title: `Feature ${id}: ${currentStatus} → ${newStatus}`,
        message: reason
          ? `Feature "${feature.name}" moved to ${newStatus}. Reason: ${reason}`
          : `Feature "${feature.name}" moved to ${newStatus}.`,
      },
    });

    // Check if any features depend on a rejected feature
    if (newStatus === "rejected") {
      const dependents = await prisma.feature.findMany({
        where: {
          dependsOn: { contains: id },
          status: { notIn: ["rejected", "completed"] },
        },
      });

      for (const dep of dependents) {
        await prisma.notification.create({
          data: {
            featureId: dep.id,
            type: "dependency_alert",
            title: `Dependency Alert: Feature ${dep.id}`,
            message: `Feature "${dep.name}" depends on Feature ${id} which has been rejected.`,
          },
        });
      }
    }

    const updated = await prisma.feature.findUnique({ where: { id } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update status:", error);
    return NextResponse.json(
      { error: "Failed to update feature status" },
      { status: 500 }
    );
  }
}
