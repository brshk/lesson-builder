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
    iconBg: "bg-violet-500",
    iconText: "text-white",
    link: "text-violet-600",
    ring: "hover:border-violet-300",
  },
  orange: {
    iconBg: "bg-orange-500",
    iconText: "text-white",
    link: "text-orange-600",
    ring: "hover:border-orange-300",
  },
  sky: {
    iconBg: "bg-sky-500",
    iconText: "text-white",
    link: "text-sky-600",
    ring: "hover:border-sky-300",
  },
  emerald: {
    iconBg: "bg-emerald-500",
    iconText: "text-white",
    link: "text-emerald-600",
    ring: "hover:border-emerald-300",
  },
  teal: {
    iconBg: "bg-teal-500",
    iconText: "text-white",
    link: "text-teal-600",
    ring: "hover:border-teal-300",
  },
  amber: {
    iconBg: "bg-amber-500",
    iconText: "text-white",
    link: "text-amber-600",
    ring: "hover:border-amber-300",
  },
  rose: {
    iconBg: "bg-rose-500",
    iconText: "text-white",
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
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    // ПКО — академічна шапочка
    case "cap":
      return (
        <svg {...common}>
          <path d="M21.5 8.6 12 4.2 2.5 8.6 12 13l9.5-4.4Z" />
          <path d="M6.3 10.6v4.6c0 1.5 2.6 2.7 5.7 2.7s5.7-1.2 5.7-2.7v-4.6" />
          <path d="M21.5 8.6v5.2" />
        </svg>
      );
    // ШС — шкільний рюкзак
    case "book":
      return (
        <svg {...common}>
          <path d="M5.8 10a4.2 4.2 0 0 1 4.2-4.2h4a4.2 4.2 0 0 1 4.2 4.2v9.1a1.6 1.6 0 0 1-1.6 1.6H7.4a1.6 1.6 0 0 1-1.6-1.6V10Z" />
          <path d="M9.6 5.8v-1a2 2 0 0 1 2-2h.8a2 2 0 0 1 2 2v1" />
          <rect x="9.2" y="12.6" width="5.6" height="4.6" rx="1.3" />
        </svg>
      );
    // STEP School — будівля школи
    case "school":
      return (
        <svg {...common}>
          <path d="M2.8 20.6h18.4" />
          <path d="M4.9 20.6V9.6L12 5.1l7.1 4.5v11" />
          <path d="M9.9 20.6v-5.1h4.2v5.1" />
          <path d="M12 5.1V2.6h2.6" />
        </svg>
      );
    // Освіта для дітей — ракета
    case "rocket":
      return (
        <svg {...common}>
          <path d="M12 2.6c2.9 2.3 4.6 5.8 4.6 9.5l-1.7 4.4H9.1L7.4 12.1c0-3.7 1.7-7.2 4.6-9.5Z" />
          <circle cx="12" cy="9.8" r="1.9" />
          <path d="M9.1 16.5 6.6 18.9c-.6.6-.2 1.6.7 1.6h9.4c.9 0 1.3-1 .7-1.6l-2.5-2.4" />
          <path d="M12 18.4v2.9" />
        </svg>
      );
    // СК — стос модулів
    case "layers":
      return (
        <svg {...common}>
          <path d="m12 2.8 9 4.6-9 4.6-9-4.6 9-4.6Z" />
          <path d="m3 12 9 4.6L21 12" />
          <path d="m3 16.6 9 4.6 9-4.6" />
        </svg>
      );
    // коледж — будівля
    case "building":
      return (
        <svg {...common}>
          <path d="M3.6 20.8V5.2a1.4 1.4 0 0 1 1.4-1.4h8.4a1.4 1.4 0 0 1 1.4 1.4v15.6" />
          <path d="M14.8 9.6h4.2a1.4 1.4 0 0 1 1.4 1.4v9.8" />
          <path d="M7 8h4.2M7 12h4.2M7 16h4.2M2.4 20.8h19.2" />
        </svg>
      );
    // ВНЗ — нагорода з дипломом
    case "diploma":
      return (
        <svg {...common}>
          <circle cx="12" cy="8.6" r="5.4" />
          <path d="M12 6.4v2.2l1.5 1.1" />
          <path d="m8.5 13.3-1.1 7.5 4.6-2.5 4.6 2.5-1.1-7.5" />
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
                {d.code ? `${d.code} — ` : ""}
                {directionName(lang, d.id, d.name)}
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
