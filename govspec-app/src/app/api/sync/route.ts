import { NextResponse } from "next/server";
import { syncFromMarkdown } from "@/lib/sync";

// POST /api/sync — manually trigger a sync from markdown files
export async function POST() {
  try {
    const result = await syncFromMarkdown();
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Sync failed:", error);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
