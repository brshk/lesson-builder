"use client";

import type { Direction, DirectionAccent, DirectionIcon } from "@/lib/types";
import {
  directionDescription,
  directionName,
  programsLabel,
  tr,
  type UiLang,
} from "@/lib/i18n";

const ACCENT: Record<
  DirectionAccent,
  { iconBg: string; iconText: string; link: string; ring: string }
> = {
  violet: {
    iconBg: "bg-violet-50",
    iconText: "text-violet-600",
    link: "text-violet-600",
    ring: "hover:border-violet-300",
  },
  orange: {
    iconBg: "bg-orange-50",
    iconText: "text-orange-600",
    link: "text-orange-600",
    ring: "hover:border-orange-300",
  },
  sky: {
    iconBg: "bg-sky-50",
    iconText: "text-sky-600",
    link: "text-sky-600",
    ring: "hover:border-sky-300",
  },
  emerald: {
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-600",
    link: "text-emerald-600",
    ring: "hover:border-emerald-300",
  },
  teal: {
    iconBg: "bg-teal-50",
    iconText: "text-teal-600",
    link: "text-teal-600",
    ring: "hover:border-teal-300",
  },
  amber: {
    iconBg: "bg-amber-50",
    iconText: "text-amber-600",
    link: "text-amber-600",
    ring: "hover:border-amber-300",
  },
  rose: {
    iconBg: "bg-rose-50",
    iconText: "text-rose-600",
    link: "text-rose-600",
    ring: "hover:border-rose-300",
  },
};

function Icon({ name }: { name: DirectionIcon }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "cap":
      return (
        <svg {...common}>
          <path d="M22 9 12 4 2 9l10 5 10-5Z" />
          <path d="M6 11.5V16c0 1.1 2.7 2.5 6 2.5s6-1.4 6-2.5v-4.5" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M12 6.5C10.5 5.2 8.6 4.5 6 4.5H3v13h3c2.6 0 4.5.7 6 2 1.5-1.3 3.4-2 6-2h3v-13h-3c-2.6 0-4.5.7-6 2Z" />
          <path d="M12 6.5v13" />
        </svg>
      );
    case "school":
      return (
        <svg {...common}>
          <path d="M3 10.5 12 4l9 6.5" />
          <path d="M5 12v8h14v-8" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    case "rocket":
      return (
        <svg {...common}>
          <path d="M13.5 3c3.5 1 6 4.5 6.5 8.5-3 3-6 5-9 6l-3-3c1-3 3-6 5.5-9Z" />
          <circle cx="14.5" cy="9.5" r="1.6" />
          <path d="M8 16c-1.5.5-2.5 2-3 4 2-.5 3.5-1.5 4-3" />
        </svg>
      );
    case "layers":
      return (
        <svg {...common}>
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="m3 13 9 5 9-5" />
        </svg>
      );
    case "building":
      return (
        <svg {...common}>
          <path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16" />
          <path d="M15 9h4a1 1 0 0 1 1 1v11" />
          <path d="M8 8h3M8 12h3M8 16h3M2 21h20" />
        </svg>
      );
    case "diploma":
      return (
        <svg {...common}>
          <circle cx="12" cy="9" r="5" />
          <path d="m8.5 13.5-1 7.5 4.5-2.5 4.5 2.5-1-7.5" />
        </svg>
      );
  }
}

export default function DirectionCards({
  directions,
  onSelect,
  lang = "uk",
}: {
  directions: Direction[];
  onSelect: (id: string) => void;
  lang?: UiLang;
}) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-slate-900">
        {tr(lang, "directionsTitle")}
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {tr(lang, "directionsSubtitle")}
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {directions.map((d) => {
          const a = ACCENT[d.accent];
          const count = d.disciplines?.length ?? 0;
          const desc = directionDescription(lang, d.id, d.description);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelect(d.id)}
              className={`group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:shadow-md ${a.ring}`}
            >
              <span
                className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${a.iconBg} ${a.iconText}`}
              >
                <Icon name={d.icon} />
              </span>

              <h3 className="text-lg font-bold leading-snug text-slate-900">
                {d.code} — {directionName(lang, d.id, d.name)}
              </h3>
              {desc && (
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
                  {desc}
                </p>
              )}

              <span className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {programsLabel(lang, count)}
                </span>
                <span className={`text-sm font-semibold ${a.link}`}>
                  {tr(lang, "chooseDirection")}
                  <span className="ml-1.5 inline-block transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
