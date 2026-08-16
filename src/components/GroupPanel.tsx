"use client";

import { useEffect, useState } from "react";
import { tr, type UiLang } from "@/lib/i18n";
import type { GroupContext, GroupLevel } from "@/lib/types";

const STORE_KEY = "group_profiles";

/** Профілі груп живуть у браузері викладача — спільної бази поки немає. */
function loadProfiles(): GroupContext[] {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveProfiles(list: GroupContext[]) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(list));
  } catch {
    /* приватний режим — просто не зберігаємо */
  }
}

/** Короткий підпис профілю: «11–12 років · 14 студ. · слабкий». */
export function groupSummary(g: GroupContext, lang: UiLang): string {
  const bits: string[] = [];
  if (g.ageFrom || g.ageTo) {
    bits.push(g.ageFrom && g.ageTo && g.ageFrom !== g.ageTo ? `${g.ageFrom}–${g.ageTo}` : `${g.ageFrom ?? g.ageTo}`);
  }
  if (g.students) bits.push(`${g.students} 👤`);
  if (g.level) {
    bits.push(
      tr(lang, g.level === "weak" ? "levelWeak" : g.level === "strong" ? "levelStrong" : "levelMixed")
    );
  }
  return bits.join(" · ");
}

const LEVELS: { id: GroupLevel; key: "levelWeak" | "levelMixed" | "levelStrong" }[] = [
  { id: "weak", key: "levelWeak" },
  { id: "mixed", key: "levelMixed" },
  { id: "strong", key: "levelStrong" },
];

export default function GroupPanel({
  lang,
  group,
  onChange,
}: {
  lang: UiLang;
  group: GroupContext;
  onChange: (g: GroupContext) => void;
}) {
  const [profiles, setProfiles] = useState<GroupContext[]>([]);
  const [name, setName] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => setProfiles(loadProfiles()), []);

  const set = <K extends keyof GroupContext>(k: K, v: GroupContext[K]) =>
    onChange({ ...group, [k]: v });

  const num = (v: string) => (v.trim() === "" ? undefined : Number(v));

  const save = () => {
    const label = name.trim() || groupSummary(group, lang);
    if (!label) return;
    const next = [{ ...group, name: label }, ...profiles.filter((p) => p.name !== label)].slice(0, 12);
    setProfiles(next);
    saveProfiles(next);
    setName("");
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const remove = (label?: string) => {
    const next = profiles.filter((p) => p.name !== label);
    setProfiles(next);
    saveProfiles(next);
  };

  const field =
    "w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-sky-500 focus:outline-none";

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200 space-y-3">
      <div>
        <h2 className="font-semibold text-slate-800">👥 {tr(lang, "groupSection")}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{tr(lang, "groupHint")}</p>
      </div>

      {profiles.length > 0 && (
        <div>
          <span className="text-xs font-medium text-slate-600">{tr(lang, "savedGroups")}</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {profiles.map((p) => (
              <span
                key={p.name}
                className="group inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 py-1 pl-2.5 pr-1 text-xs"
              >
                <button
                  type="button"
                  onClick={() => onChange({ ...p })}
                  className="font-medium text-slate-700 hover:text-sky-600"
                  title={groupSummary(p, lang)}
                >
                  {p.name}
                </button>
                <button
                  type="button"
                  onClick={() => remove(p.name)}
                  aria-label={tr(lang, "deleteGroup")}
                  title={tr(lang, "deleteGroup")}
                  className="rounded-full px-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">{tr(lang, "ageLabel")}</span>
          <div className="mt-1 flex items-center gap-1.5">
            <input
              type="number"
              min={4}
              max={80}
              value={group.ageFrom ?? ""}
              onChange={(e) => set("ageFrom", num(e.target.value))}
              placeholder={tr(lang, "ageFrom")}
              className={field}
            />
            <span className="text-slate-400">–</span>
            <input
              type="number"
              min={4}
              max={80}
              value={group.ageTo ?? ""}
              onChange={(e) => set("ageTo", num(e.target.value))}
              placeholder={tr(lang, "ageTo")}
              className={field}
            />
          </div>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-600">{tr(lang, "studentsLabel")}</span>
          <input
            type="number"
            min={1}
            max={100}
            value={group.students ?? ""}
            onChange={(e) => set("students", num(e.target.value))}
            className={`${field} mt-1`}
          />
        </label>
      </div>

      <div>
        <span className="text-xs font-medium text-slate-600">{tr(lang, "levelLabel")}</span>
        <div className="mt-1 flex gap-1.5">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => set("level", group.level === l.id ? undefined : l.id)}
              className={`flex-1 rounded-lg border px-2 py-1.5 text-xs transition ${
                group.level === l.id
                  ? "border-sky-500 bg-sky-500 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-sky-400"
              }`}
            >
              {tr(lang, l.key)}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="text-xs font-medium text-slate-600">{tr(lang, "hardwareLabel")}</span>
        <input
          value={group.hardware ?? ""}
          onChange={(e) => set("hardware", e.target.value)}
          placeholder={tr(lang, "hardwarePlaceholder")}
          className={`${field} mt-1`}
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium text-slate-600">{tr(lang, "priorLabel")}</span>
        <textarea
          rows={2}
          value={group.priorKnowledge ?? ""}
          onChange={(e) => set("priorKnowledge", e.target.value)}
          placeholder={tr(lang, "priorPlaceholder")}
          className={`${field} mt-1`}
        />
      </label>

      <div className="flex gap-2 pt-0.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={tr(lang, "groupNamePlaceholder")}
          className={field}
        />
        <button
          type="button"
          onClick={save}
          className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-sky-400 hover:text-sky-600"
        >
          {justSaved ? `✓ ${tr(lang, "groupSaved")}` : tr(lang, "saveGroup")}
        </button>
      </div>
    </div>
  );
}
