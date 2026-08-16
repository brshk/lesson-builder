"use client";

import { useState } from "react";
import { tr, type UiLang } from "@/lib/i18n";
import type { ComplianceReport, Language } from "@/lib/types";

/** Колір індикатора: зелений від 85%, бурштиновий від 60%, інакше червоний. */
function tone(coverage: number) {
  if (coverage >= 85) return { ring: "#059669", text: "text-emerald-700", bg: "bg-emerald-50" };
  if (coverage >= 60) return { ring: "#d97706", text: "text-amber-700", bg: "bg-amber-50" };
  return { ring: "#dc2626", text: "text-red-700", bg: "bg-red-50" };
}

function Dial({ value }: { value: number }) {
  const t = tone(value);
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" className="shrink-0" role="img" aria-label={`${value}%`}>
      <circle cx="34" cy="34" r={r} fill="none" stroke="#e2e8f0" strokeWidth="7" />
      <circle
        cx="34"
        cy="34"
        r={r}
        fill="none"
        stroke={t.ring}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${(c * value) / 100} ${c}`}
        transform="rotate(-90 34 34)"
      />
      <text
        x="34"
        y="34"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="16"
        fontWeight="700"
        fill={t.ring}
      >
        {value}%
      </text>
    </svg>
  );
}

export default function CompliancePanel({
  lang,
  lessonText,
  discipline,
  topic,
  language,
  product,
  programFileId,
  requestHeaders,
  hasCurriculum,
}: {
  lang: UiLang;
  lessonText: string;
  discipline: string;
  topic: string;
  language: Language;
  product?: string;
  programFileId?: string;
  requestHeaders: Record<string, string>;
  hasCurriculum: boolean;
}) {
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const check = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...requestHeaders },
        body: JSON.stringify({
          lessonText,
          discipline,
          topic,
          language,
          product,
          programFileId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setReport(data as ComplianceReport);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!hasCurriculum) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold text-slate-600">🎯 {tr(lang, "complianceTitle")}</p>
        <p className="mt-1 text-xs text-slate-500">{tr(lang, "noCurriculumBound")}</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-700">🎯 {tr(lang, "complianceTitle")}</p>
          <button
            type="button"
            onClick={check}
            disabled={busy}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40"
          >
            {busy ? tr(lang, "checking") : tr(lang, "checkCompliance")}
          </button>
        </div>
        {error && (
          <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }

  if (!report.curriculumFound) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold text-slate-600">🎯 {tr(lang, "complianceTitle")}</p>
        <p className="mt-1 text-xs text-slate-500">{tr(lang, "noCurriculumBound")}</p>
      </div>
    );
  }

  const t = tone(report.coverage);
  const uncovered = report.items.filter((i) => !i.covered);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-4 border-b border-slate-100 px-4 py-3">
        <Dial value={report.coverage} />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${t.text}`}>🎯 {tr(lang, "complianceTitle")}</p>
          {report.programName && (
            <p className="mt-0.5 truncate text-xs text-slate-500">📘 {report.programName}</p>
          )}
          <p className="mt-0.5 text-[11px] text-slate-400">{tr(lang, "coverageNote")}</p>
        </div>
        <button
          type="button"
          onClick={check}
          disabled={busy}
          className="shrink-0 self-start rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
        >
          {busy ? tr(lang, "checking") : tr(lang, "recheck")}
        </button>
      </div>

      <div className="space-y-3 px-4 py-3 text-xs">
        {report.items.length > 0 && (
          <div>
            <p className="font-semibold text-slate-700">{tr(lang, "curriculumItems")}</p>
            <ul className="mt-1.5 space-y-1">
              {report.items.map((it, i) => (
                <li key={i} className="flex gap-2">
                  <span className={it.covered ? "text-emerald-600" : "text-red-500"}>
                    {it.covered ? "✓" : "✕"}
                  </span>
                  <span className="flex-1">
                    <span className={it.covered ? "text-slate-700" : "text-slate-800 font-medium"}>
                      {it.text}
                    </span>
                    {it.covered && it.blocks?.length > 0 && (
                      <span className="ml-1 text-slate-400">
                        — {tr(lang, "inBlocks")}: {it.blocks.join(", ")}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            {uncovered.length === 0 && (
              <p className="mt-1.5 text-emerald-700">✓ {tr(lang, "allCovered")}</p>
            )}
          </div>
        )}

        {report.outcomes.length > 0 && (
          <div>
            <p className="font-semibold text-slate-700">{tr(lang, "outcomesTitle")}</p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-slate-600">
              {report.outcomes.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>
        )}

        {report.aiAdditions.length > 0 && (
          <div className="rounded-lg bg-sky-50 px-3 py-2">
            <p className="font-semibold text-sky-800">🤖 {tr(lang, "aiAddedTitle")}</p>
            <ul className="mt-1 space-y-1 text-sky-900">
              {report.aiAdditions.map((a, i) => (
                <li key={i}>
                  <span className="font-medium">{a.block}</span> — {a.what}
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.outOfScope.length > 0 && (
          <div className="rounded-lg bg-amber-50 px-3 py-2">
            <p className="font-semibold text-amber-900">⚠️ {tr(lang, "outOfScopeTitle")}</p>
            <ul className="mt-1 space-y-1 text-amber-900">
              {report.outOfScope.map((o, i) => (
                <li key={i}>
                  <span className="font-medium">{o.block}</span> — {o.why}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
