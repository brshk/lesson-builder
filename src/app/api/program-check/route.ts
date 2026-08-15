import { NextRequest, NextResponse } from "next/server";
import { PROGRAM_DRIVE, driveRefFor, driveViewUrl } from "@/lib/programDrive";
import {
  fetchDriveProgram,
  listPublicFolder,
  pickProgramFile,
} from "@/lib/driveProgramFetch";

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
  const fileId = req.nextUrl.searchParams.get("fileId");
  const folderId = req.nextUrl.searchParams.get("folderId");

  // Перегляд вмісту публічної папки: /api/program-check?folderId=<id>
  if (folderId) {
    try {
      const items = await listPublicFolder(folderId);
      const pick = pickProgramFile(items);
      return NextResponse.json({
        ok: items.length > 0,
        folderId,
        count: items.length,
        picked: pick ? { id: pick.id, name: pick.name, kind: pick.kind } : null,
        items: items.map((i) => ({ id: i.id, name: i.name, kind: i.kind })),
      });
    } catch (e) {
      return NextResponse.json(
        { ok: false, folderId, error: e instanceof Error ? e.message : "error" },
        { status: 502 }
      );
    }
  }

  // Перевірка довільного файлу: /api/program-check?fileId=<id>&kind=docx|gdoc|pdf|gsheet
  if (fileId) {
    const kindParam = req.nextUrl.searchParams.get("kind") || "docx";
    const kind = (["gdoc", "docx", "pdf"].includes(kindParam)
      ? kindParam
      : "docx") as "gdoc" | "docx" | "pdf";
    const ref = {
      fileId,
      fileName: req.nextUrl.searchParams.get("name") || fileId,
      kind,
      folder: "",
    };
    const started = Date.now();
    const doc = await fetchDriveProgram(ref);
    return NextResponse.json(
      doc
        ? {
            ok: true,
            fileId,
            kind,
            chars: doc.text.length,
            ms: Date.now() - started,
            preview: doc.text.slice(0, 400),
          }
        : {
            ok: false,
            fileId,
            kind,
            error:
              "Не вдалося прочитати — найімовірніше, файл не відкритий «за посиланням»",
          },
      { status: doc ? 200 : 502 }
    );
  }

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
