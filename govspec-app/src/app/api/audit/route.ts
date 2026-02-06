import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/audit — get all audit logs
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const featureId = searchParams.get("featureId");

    const where = featureId ? { featureId } : {};

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { feature: { select: { name: true } } },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
