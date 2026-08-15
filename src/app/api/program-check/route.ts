import { NextRequest, NextResponse } from "next/server";
import { PROGRAM_DRIVE, driveRefFor, driveViewUrl } from "@/lib/programDrive";
import { fetchDriveProgram } from "@/lib/driveProgramFetch";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Діагностика прив'язок навчальних програм.
 *
 *   /api/program-check                        → список усіх прив'язок
 *   /api/program-check?product=<назва>        → перевірка читання конкретної
 */
export async function GET(req: NextRequest) {
  const product = req.nextUrl.searchParams.get("product");

  if (!product) {
    return NextResponse.json({
      count: Object.keys(PROGRAM_DRIVE).length,
      programs: Object.entries(PROGRAM_DRIVE).map(([name, ref]) => ({
        product: name,
        file: ref.fileName,
        kind: ref.kind,
        url: driveViewUrl(ref),
      })),
    });
  }

  const ref = driveRefFor(product);
  if (!ref) {
    return NextResponse.json(
      { ok: false, product, error: "Для цієї програми немає прив'язки до Google Drive" },
      { status: 404 }
    );
  }

  const started = Date.now();
  const doc = await fetchDriveProgram(ref);
  if (!doc) {
    return NextResponse.json(
      {
        ok: false,
        product,
        file: ref.fileName,
        url: driveViewUrl(ref),
        error: "Не вдалося прочитати файл (перевірте доступ «за посиланням»)",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    product,
    file: doc.name,
    url: driveViewUrl(ref),
    chars: doc.text.length,
    ms: Date.now() - started,
    preview: doc.text.slice(0, 400),
  });
}
