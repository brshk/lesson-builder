import portalDocs from "@/data/portalDocs.json";
import { PROGRAM_PORTAL_SLUG } from "./portalMap";

type PortalDoc = { title: string; category: string; doc: string };

const SNAPSHOT = portalDocs as {
  fetchedAt: string;
  source: string;
  count: number;
  docs: Record<string, PortalDoc>;
};

export function portalSnapshotInfo() {
  return { fetchedAt: SNAPSHOT.fetchedAt, count: SNAPSHOT.count };
}

/** Чи є документ порталу для цієї програми. */
export function hasPortalDoc(programName?: string): boolean {
  if (!programName) return false;
  const slug = PROGRAM_PORTAL_SLUG[programName];
  return Boolean(slug && SNAPSHOT.docs[slug]);
}

/**
 * Документ продукту з ПКО-порталу.
 *
 * Якщо задані PORTAL_API_URL і PORTAL_API_TOKEN — тягне живу версію
 * (портал має підтримувати `Authorization: Bearer <token>` на /api/doc/<slug>).
 * Інакше повертає вбудований зліпок.
 */
export async function getPortalDoc(
  programName?: string
): Promise<{ title: string; text: string; live: boolean } | undefined> {
  if (!programName) return undefined;
  const slug = PROGRAM_PORTAL_SLUG[programName];
  if (!slug) return undefined;

  const base = process.env.PORTAL_API_URL;
  const token = process.env.PORTAL_API_TOKEN;
  if (base && token) {
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/api/doc/${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.ok) {
        const text = await res.text();
        if (text.trim().length > 200) {
          return {
            title: SNAPSHOT.docs[slug]?.title ?? programName,
            text,
            live: true,
          };
        }
      }
    } catch (e) {
      console.error("Portal live fetch failed, using snapshot:", e);
    }
  }

  const local = SNAPSHOT.docs[slug];
  if (!local) return undefined;
  return { title: local.title, text: local.doc, live: false };
}
