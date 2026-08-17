/**
 * Коротка картка продукту з ПКО-порталу: категорія і тривалість навчання.
 *
 * Дані зчитано з каталогу порталу 2026-08-17. Тривалість береться з поля
 * картки («2 роки · 4 семестри»), а де його немає — з рядка «| Тривалість |»
 * у документі продукту. Оновлювати разом із src/data/portalMeta.json.
 */
import meta from "@/data/portalMeta.json";
import { PROGRAM_PORTAL_SLUG } from "./portalMap";

export interface PortalMetaEntry {
  title: string;
  category: string;
  /** Порожньо, якщо портал не вказує тривалості для цього продукту. */
  duration: string;
}

const META = meta as Record<string, PortalMetaEntry>;

export function portalMetaFor(programName?: string): PortalMetaEntry | undefined {
  if (!programName) return undefined;
  const slug = PROGRAM_PORTAL_SLUG[programName];
  return slug ? META[slug] : undefined;
}

/** Тривалість навчання для картки програми («2 роки · 4 семестри»). */
export function durationFor(programName?: string): string {
  return portalMetaFor(programName)?.duration || "";
}
