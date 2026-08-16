"use client";

import type { Direction, DirectionAccent } from "@/lib/types";
import { driveRefFor } from "@/lib/programDrive";
import { directionName, groupTitle, tr, type UiLang } from "@/lib/i18n";

const ACCENT: Record<
  DirectionAccent,
  { badgeBg: string; badgeText: string; link: string; ring: string; chip: string }
> = {
  violet: {
    badgeBg: "bg-violet-50",
    badgeText: "text-violet-600",
    link: "text-violet-600",
    ring: "hover:border-violet-300",
    chip: "bg-violet-50 text-violet-700",
  },
  orange: {
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-600",
    link: "text-orange-600",
    ring: "hover:border-orange-300",
    chip: "bg-orange-50 text-orange-700",
  },
  sky: {
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-600",
    link: "text-sky-600",
    ring: "hover:border-sky-300",
    chip: "bg-sky-50 text-sky-700",
  },
  emerald: {
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-600",
    link: "text-emerald-600",
    ring: "hover:border-emerald-300",
    chip: "bg-emerald-50 text-emerald-700",
  },
  teal: {
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-600",
    link: "text-teal-600",
    ring: "hover:border-teal-300",
    chip: "bg-teal-50 text-teal-700",
  },
  amber: {
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-600",
    link: "text-amber-600",
    ring: "hover:border-amber-300",
    chip: "bg-amber-50 text-amber-700",
  },
  rose: {
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-600",
    link: "text-rose-600",
    ring: "hover:border-rose-300",
    chip: "bg-rose-50 text-rose-700",
  },
};

/** Ініціали програми для бейджа: «Python + AI» → «PA». */
function initials(name: string): string {
  const words = name
    .replace(/[()+/–—-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !/^(та|і|в|у|для|з|на|the|and)$/i.test(w));
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function ProgramCards({
  direction,
  onSelect,
  onBack,
  lang = "uk",
}: {
  direction: Direction;
  onSelect: (program: string) => void;
  onBack: () => void;
  lang?: UiLang;
}) {
  const a = ACCENT[direction.accent];
  const programs = direction.disciplines ?? [];
  const groups =
    direction.groups && direction.groups.length > 0
      ? direction.groups
      : [{ title: "", programs }];

  const card = (p: string) => (
    <button
      key={p}
      type="button"
      onClick={() => onSelect(p)}
      className={`group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md ${a.ring}`}
    >
      <span
        className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${a.badgeBg} ${a.badgeText}`}
      >
        {initials(p)}
      </span>
      <h3 className="text-base font-semibold leading-snug text-slate-900">{p}</h3>
      <span className="mt-2 flex-1 text-xs text-slate-400">
        {driveRefFor(p) ? (
          <span className="text-emerald-600">📘 {tr(lang, "programBound")}</span>
        ) : (
          ""
        )}
      </span>
      <span
        className={`mt-5 border-t border-slate-100 pt-3 text-sm font-semibold ${a.link}`}
      >
        {tr(lang, "chooseProgram")}
        <span className="ml-1.5 inline-block transition-transform group-hover:translate-x-1">
          →
        </span>
      </span>
    </button>
  );

  return (
    <section>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex w-fit items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        ← {tr(lang, "allDirections")}
      </button>

      <span
        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${a.chip}`}
      >
        {direction.code} — {directionName(lang, direction.id, direction.name)}
      </span>

      <h2 className="mt-3 text-2xl font-bold text-slate-900">
        {tr(lang, "chooseProgramTitle")}
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {tr(lang, "chooseProgramSubtitle")}
      </p>

      {programs.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">{tr(lang, "noProgramsYet")}</p>
          <button
            type="button"
            onClick={() => onSelect("")}
            className="mt-4 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600"
          >
            {tr(lang, "continueWithoutProgram")}
          </button>
        </div>
      ) : (
        <>
          {groups.map((g) => (
            <div key={g.title || "all"} className="mt-8 first:mt-6">
              {g.title && (
                <div className="mb-3 flex items-center gap-3">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                    {groupTitle(lang, g.title)}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {g.programs.length}
                  </span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.programs.map(card)}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => onSelect("")}
            className="mt-5 text-sm text-slate-500 underline hover:text-slate-800"
          >
            {tr(lang, "skipProgram")}
          </button>
        </>
      )}
    </section>
  );
}
