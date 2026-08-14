import { NextResponse } from "next/server";
import { isDriveConfigured, listPrograms } from "@/lib/drive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDriveConfigured()) {
    return NextResponse.json({ configured: false, programs: [] });
  }
  try {
    const programs = await listPrograms();
    return NextResponse.json({ configured: true, programs });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Drive error";
    return NextResponse.json(
      { configured: true, programs: [], error: message },
      { status: 500 }
    );
  }
}
