import { NextResponse } from "next/server";
import { getGovernanceInfo } from "@/lib/govspec";

// GET /api/governance — get governance info
export async function GET() {
  try {
    const info = getGovernanceInfo();
    return NextResponse.json(info);
  } catch (error) {
    console.error("Failed to fetch governance info:", error);
    return NextResponse.json(
      { error: "Failed to fetch governance info" },
      { status: 500 }
    );
  }
}
