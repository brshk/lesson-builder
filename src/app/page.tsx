"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DIRECTIONS } from "@/lib/directions";
import DirectionCards from "@/components/DirectionCards";
import ProgramCards from "@/components/ProgramCards";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import GroupPanel from "@/components/GroupPanel";
import LessonEditor from "@/components/LessonEditor";
import CompliancePanel from "@/components/CompliancePanel";
import { streamSse } from "@/lib/sseClient";
import { PROGRAM_PORTAL_SLUG } from "@/lib/portalMap";
import { coursesFor, driveRefFor, driveViewUrl } from "@/lib/programDrive";
import { UI_LANGS, directionName, tr, type UiKey, type UiLang } from "@/lib/i18n";
import type {
  DriveProgram,
  GroupContext,
  Language,
  LessonFormat,
  MaterialType,
} from "@/lib/types";

const DURATIONS = [45, 60, 90, 120, 180] as const;

const FORMATS: { value: LessonFormat; key: UiKey }[] = [
  { value: "offline", key: "formatOffline" },
  { value: "online", key: "formatOnline" },
  { value: "mixed", key: "formatMixed" },
];

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "uk", label: "Українська" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

type ProviderId = "free" | "gemini" | "openai" | "claude";

const PROVIDERS: {
  id: ProviderId;
  label?: string;
  labelKey?: UiKey;
  badgeKey: UiKey;
  placeholder: string;
  storageKey: string;
  keyUrl: string;
  keyUrlLabel: string;
  noteKey?: UiKey;
  keyless?: boolean;
}[] = [
  {
    id: "free",
    labelKey: "providerFree",
    badgeKey: "badgeFree",
    placeholder: "",
    storageKey: "",
    keyUrl: "",
    keyUrlLabel: "",
    keyless: true,
  },
  {
    id: "gemini",
    label: "Gemini",
    badgeKey: "badgeFree",
    placeholder: "AIza…",
    storageKey: "gemini_api_key",
    keyUrl: "https://aistudio.google.com/apikey",
    keyUrlLabel: "aistudio.google.com/apikey",
    noteKey: "noteGemini",
  },
  {
    id: "openai",
    label: "ChatGPT",
    badgeKey: "badgePaid",
    placeholder: "sk-proj-…",
    storageKey: "openai_api_key",
    keyUrl: "https://platform.openai.com/api-keys",
    keyUrlLabel: "platform.openai.com/api-keys",
    noteKey: "noteOpenai",
  },
  {
    id: "claude",
    label: "Claude",
    badgeKey: "badgePaid",
    placeholder: "sk-ant-…",
    storageKey: "anthropic_api_key",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyUrlLabel: "console.anthropic.com",
    noteKey: "noteClaude",
  },
];

const MATERIALS: { value: MaterialType; labelKey: UiKey; hintKey: UiKey }[] = [
  { value: "scenario", labelKey: "matScenario", hintKey: "matScenarioHint" },
  { value: "slides", labelKey: "matSlides", hintKey: "matSlidesHint" },
  { value: "practice", labelKey: "matPractice", hintKey: "matPracticeHint" },
  { value: "homework", labelKey: "matHomework", hintKey: "matHomeworkHint" },
];

type Phase = "idle" | "generating" | "done" | "error";

export default function Home() {
  // мова інтерфейсу (зберігається у браузері)
  const [uiLang, setUiLang] = useState<UiLang>("uk");
  const t = useCallback((k: UiKey) => tr(uiLang, k), [uiLang]);

  // AI-провайдер і API-ключ користувача (BYOK) — зберігаються лише в браузері
  const [provider, setProvider] = useState<ProviderId>("free");
  const [keys, setKeys] = useState<Record<ProviderId, string>>({
    free: "",
    gemini: "",
    openai: "",
    claude: "",
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const apiKey = keys[provider];
  const providerInfo = PROVIDERS.find((p) => p.id === provider)!;

  useEffect(() => {
    try {
      const savedProvider = window.localStorage.getItem("llm_provider");
      if (PROVIDERS.some((p) => p.id === savedProvider)) {
        setProvider(savedProvider as ProviderId);
      }
      setKeys({
        free: "",
        gemini: window.localStorage.getItem("gemini_api_key") ?? "",
        openai: window.localStorage.getItem("openai_api_key") ?? "",
        claude: window.localStorage.getItem("anthropic_api_key") ?? "",
      });
    } catch {
      /* localStorage недоступний */
    }
  }, []);

  const updateProvider = (p: ProviderId) => {
    setProvider(p);
    try {
      window.localStorage.setItem("llm_provider", p);
    } catch {
      /* ignore */
    }
  };

  const updateApiKey = (value: string) => {
    setKeys((prev) => ({ ...prev, [provider]: value }));
    try {
      if (value.trim()) {
        window.localStorage.setItem(providerInfo.storageKey, value.trim());
      } else {
        window.localStorage.removeItem(providerInfo.storageKey);
      }
    } catch {
      /* ignore */
    }
  };

  // форма
  const [step, setStep] = useState<"directions" | "programs" | "form">(
    "directions"
  );
  const [directionId, setDirectionId] = useState(DIRECTIONS[0].id);
  const currentDirection =
    DIRECTIONS.find((d) => d.id === directionId) ?? DIRECTIONS[0];
  const [product, setProduct] = useState("");
  // курс усередині укрупненої картки (МКА / ПШ / Дитячі спецкурси)
  const [course, setCourse] = useState("");
  const courseOptions = coursesFor(product);
  /** Що саме йде в генерацію: конкретний курс, якщо обраний, інакше продукт. */
  const effectiveProduct = course || product;
  const boundProgram = driveRefFor(effectiveProduct);
  const [discipline, setDiscipline] = useState("");
  const [topic, setTopic] = useState("");
  const [durationChoice, setDurationChoice] = useState<string>("90");
  const [customDuration, setCustomDuration] = useState<string>("");
  const [format, setFormat] = useState<LessonFormat>("offline");
  const [language, setLanguage] = useState<Language>("uk");
  const [extraContext, setExtraContext] = useState("");
  const [tools, setTools] = useState("");
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>(["scenario"]);
  const [group, setGroup] = useState<GroupContext>({});

  // відновлюємо мову інтерфейсу та синхронізуємо мову генерації
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("ui_lang");
      if (UI_LANGS.some((l) => l.id === saved)) {
        setUiLang(saved as UiLang);
        setLanguage(saved as Language);
      }
    } catch {
      /* localStorage недоступний */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = uiLang;
  }, [uiLang]);

  const changeUiLang = (l: UiLang) => {
    setUiLang(l);
    setLanguage(l as Language);
    try {
      window.localStorage.setItem("ui_lang", l);
    } catch {
      /* ignore */
    }
  };

  // програми з Google Drive
  const [programs, setPrograms] = useState<DriveProgram[]>([]);
  const [driveConfigured, setDriveConfigured] = useState<boolean | null>(null);
  const [programFileId, setProgramFileId] = useState<string>("");
  const [programFilter, setProgramFilter] = useState("");

  // генерація
  const [phase, setPhase] = useState<Phase>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [output, setOutput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/programs")
      .then((r) => r.json())
      .then((data) => {
        setDriveConfigured(Boolean(data.configured));
        setPrograms(data.programs ?? []);
      })
      .catch(() => setDriveConfigured(false));
  }, []);

  // автопідбір програми за назвою дисципліни або продукту
  useEffect(() => {
    if (programFileId) return;
    const candidates = [discipline.trim(), product.trim()]
      .filter((s) => s.length > 2)
      .map((s) => s.toLowerCase());
    for (const c of candidates) {
      const match = programs.find(
        (p) =>
          p.name.toLowerCase().includes(c) || c.includes(p.name.toLowerCase().replace(/\.[^.]+$/, ""))
      );
      if (match) {
        setProgramFileId(match.id);
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discipline, product, programs]);

  const filteredPrograms = useMemo(() => {
    const f = programFilter.trim().toLowerCase();
    if (!f) return programs;
    return programs.filter((p) => p.name.toLowerCase().includes(f));
  }, [programs, programFilter]);

  const duration =
    durationChoice === "custom" ? Number(customDuration) || 0 : Number(durationChoice);

  const canSubmit =
    discipline.trim().length > 1 &&
    topic.trim().length > 1 &&
    duration >= 15 &&
    materialTypes.length > 0 &&
    phase !== "generating";

  const toggleMaterial = (m: MaterialType) => {
    setMaterialTypes((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const stopGeneration = () => {
    abortRef.current?.abort();
    setPhase("done");
    setStatusMessage("");
  };

  const requestHeaders = useMemo(
    () => ({
      "x-provider": provider,
      ...(apiKey.trim() ? { "x-user-api-key": apiKey.trim() } : {}),
    }),
    [provider, apiKey]
  );

  const generate = useCallback(async () => {
    setPhase("generating");
    setOutput("");
    setErrorMessage("");
    setStatusMessage(t("preparing"));

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamSse(
        "/api/generate",
        {
          directionId,
          product: effectiveProduct || undefined,
          discipline: discipline.trim(),
          topic: topic.trim(),
          duration,
          format,
          language,
          extraContext,
          tools,
          materialTypes,
          programFileId: programFileId || undefined,
          group,
        },
        requestHeaders,
        {
          onText: (text) => {
            setOutput((prev) => prev + text);
            setStatusMessage("");
          },
          onStatus: (message) => setStatusMessage(message),
        },
        controller.signal
      );
      setPhase("done");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setErrorMessage((e as Error).message);
      setPhase("error");
    } finally {
      setStatusMessage("");
      abortRef.current = null;
    }
  }, [
    requestHeaders, directionId, effectiveProduct, discipline, topic,
    duration, format, language, extraContext, tools, materialTypes, programFileId, group, t,
  ]);

  const exportTitle = `${discipline} — ${topic}`.slice(0, 120);

  const downloadMarkdown = () => {
    const blob = new Blob([output], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${exportTitle || "lesson-materials"}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadDocx = async () => {
    const res = await fetch("/api/export/docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown: output, title: exportTitle }),
    });
    if (!res.ok) {
      alert(t("docxFailed"));
      return;
    }
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${exportTitle || "lesson-materials"}.docx`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copyOutput = async () => {
    await navigator.clipboard.writeText(output);
  };

  /** Клік по логотипу з будь-якої сторінки повертає на головну. */
  const goHome = () => {
    setStep("directions");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-5 flex items-center gap-3">
          <h1 className="m-0">
            <button
              type="button"
              onClick={goHome}
              title={t("toHome")}
              aria-label={t("toHome")}
              className="flex items-center gap-3 rounded-xl text-left transition hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <Logo size={40} id="lb-head" />
              <span>
                <span className="block text-lg font-semibold leading-tight">
                  {t("appTitle")}
                </span>
                <span className="block text-xs font-normal text-slate-400">
                  {t("appSubtitle")}
                </span>
              </span>
            </button>
          </h1>

          <div
            className="ml-auto flex items-center gap-1 rounded-lg bg-slate-800 p-1"
            role="group"
            aria-label={t("interfaceLanguage")}
          >
            {UI_LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => changeUiLang(l.id)}
                title={l.label}
                aria-pressed={uiLang === l.id}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  uiLang === l.id
                    ? "bg-sky-500 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {l.short}
              </button>
            ))}
          </div>
        </div>
      </header>

      {step === "directions" && (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10">
          <DirectionCards
            lang={uiLang}
            directions={DIRECTIONS}
            onSelect={(id) => {
              setDirectionId(id);
              setProduct("");
              setCourse("");
              setStep("programs");
            }}
          />
        </main>
      )}

      {step === "programs" && (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10">
          <ProgramCards
            lang={uiLang}
            direction={currentDirection}
            onBack={() => setStep("directions")}
            onSelect={(p) => {
              setProduct(p);
              setCourse("");
              setStep("form");
            }}
          />
        </main>
      )}

      {step === "form" && (
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <button
            type="button"
            onClick={() => setStep("directions")}
            className="text-slate-500 hover:text-slate-800"
          >
            {t("breadcrumbDirections")}
          </button>
          <span className="text-slate-300">/</span>
          <button
            type="button"
            onClick={() => setStep("programs")}
            className="text-slate-500 hover:text-slate-800"
          >
            {currentDirection.code ||
              directionName(uiLang, currentDirection.id, currentDirection.name)}
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-800">
            {product || t("noProgramBound")}
          </span>
          <button
            type="button"
            onClick={() => setStep("programs")}
            className="ml-1 rounded-md border border-slate-300 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100"
          >
            {t("change")}
          </button>
        </div>
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* ФОРМА */}
        <section className="space-y-5">
          <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200 space-y-3">
            <h2 className="font-semibold text-slate-800">{t("aiModelAndKey")}</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => updateProvider(p.id)}
                  className={`rounded-lg px-2 py-2 text-sm border transition ${
                    provider === p.id
                      ? "bg-sky-500 text-white border-sky-500"
                      : "bg-white text-slate-700 border-slate-300 hover:border-sky-400"
                  }`}
                >
                  {p.labelKey ? t(p.labelKey) : p.label}
                  <span
                    className={`block text-[11px] ${
                      provider === p.id ? "text-sky-100" : "text-slate-400"
                    }`}
                  >
                    {t(p.badgeKey)}
                  </span>
                </button>
              ))}
            </div>
            {providerInfo.keyless ? (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                🎁 {t("freeNote")}
              </p>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => updateApiKey(e.target.value)}
                    placeholder={providerInfo.placeholder}
                    autoComplete="off"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((s) => !s)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-600 hover:bg-slate-100"
                  >
                    {showApiKey ? t("hide") : t("show")}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  {t("keyLabel")}:{" "}
                  <a
                    href={providerInfo.keyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 underline"
                  >
                    {providerInfo.keyUrlLabel}
                  </a>
                  . {providerInfo.noteKey ? t(providerInfo.noteKey) : ""}{" "}
                  {t("keyStored")}
                </p>
              </>
            )}
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200 space-y-4">
            <h2 className="font-semibold text-slate-800">{t("lessonParams")}</h2>

            <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
              <p className="text-slate-500">
                {t("direction")}:{" "}
                <span className="font-medium text-slate-800">
                  {currentDirection.code ? `${currentDirection.code} — ` : ""}
                  {directionName(uiLang, currentDirection.id, currentDirection.name)}
                </span>
              </p>
              {product && (
                <p className="mt-0.5 text-slate-500">
                  {t("program")}:{" "}
                  <span className="font-medium text-slate-800">{product}</span>
                </p>
              )}
              {courseOptions.length > 0 && (
                <label className="mt-2 block">
                  <span className="text-xs font-medium text-slate-600">
                    {t("course")}
                  </span>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-sky-500 focus:outline-none"
                  >
                    <option value="">{t("courseAny")}</option>
                    {courseOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                        {driveRefFor(c) ? " · 📘" : ""}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-[11px] text-slate-400">
                    {t("courseHint")}
                  </span>
                </label>
              )}
              {effectiveProduct && PROGRAM_PORTAL_SLUG[effectiveProduct] && (
                <p className="mt-1 text-xs text-emerald-700">
                  📄 {t("portalDocUsed")}
                </p>
              )}
              <button
                type="button"
                onClick={() => setStep("programs")}
                className="mt-1.5 text-xs text-sky-600 underline hover:text-sky-700"
              >
                {t("changeDirectionOrProgram")}
              </button>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {t("discipline")} *
              </span>
              <input
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                placeholder={t("disciplinePlaceholder")}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {t("topic")} *
              </span>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t("topicPlaceholder")}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </label>

            {/* Програма навчання з Google Drive */}
            <div>
              <span className="text-sm font-medium text-slate-700">
                {t("curriculumDrive")}
              </span>
              {boundProgram ? (
                <div className="mt-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  📘 {t("bound")}:{" "}
                  <a
                    href={driveViewUrl(boundProgram)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline"
                  >
                    {boundProgram.fileName}
                  </a>
                  <span className="mt-0.5 block text-emerald-700">
                    {t("boundNote")}
                  </span>
                </div>
              ) : (
                <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  {t("notBoundNote")}
                </p>
              )}
              {!boundProgram && driveConfigured && (
                <>
                  <input
                    value={programFilter}
                    onChange={(e) => setProgramFilter(e.target.value)}
                    placeholder={t("searchProgram")}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  />
                  <select
                    value={programFileId}
                    onChange={(e) => setProgramFileId(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  >
                    <option value="">{t("withoutProgram")}</option>
                    {filteredPrograms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </>
              )}
              {!boundProgram && driveConfigured === null && (
                <p className="mt-1 text-xs text-slate-400">{t("loadingPrograms")}</p>
              )}
            </div>

            {/* Тривалість */}
            <div>
              <span className="text-sm font-medium text-slate-700">{t("duration")}</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDurationChoice(String(d))}
                    className={`rounded-lg px-3 py-1.5 text-sm border transition ${
                      durationChoice === String(d)
                        ? "bg-sky-500 text-white border-sky-500"
                        : "bg-white text-slate-700 border-slate-300 hover:border-sky-400"
                    }`}
                  >
                    {d} {t("minutes")}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setDurationChoice("custom")}
                  className={`rounded-lg px-3 py-1.5 text-sm border transition ${
                    durationChoice === "custom"
                      ? "bg-sky-500 text-white border-sky-500"
                      : "bg-white text-slate-700 border-slate-300 hover:border-sky-400"
                  }`}
                >
                  {t("customDuration")}
                </button>
              </div>
              {durationChoice === "custom" && (
                <input
                  type="number"
                  min={15}
                  max={480}
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  placeholder={t("customDurationPlaceholder")}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                />
              )}
            </div>

            {/* Формат */}
            <div>
              <span className="text-sm font-medium text-slate-700">{t("format")}</span>
              <div className="mt-1 flex gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFormat(f.value)}
                    className={`flex-1 rounded-lg px-3 py-1.5 text-sm border transition ${
                      format === f.value
                        ? "bg-sky-500 text-white border-sky-500"
                        : "bg-white text-slate-700 border-slate-300 hover:border-sky-400"
                    }`}
                  >
                    {t(f.key)}
                  </button>
                ))}
              </div>
            </div>

            {/* Мова */}
            <div>
              <span className="text-sm font-medium text-slate-700">
                {t("materialsLanguage")}
              </span>
              <div className="mt-1 flex gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLanguage(l.value)}
                    className={`flex-1 rounded-lg px-3 py-1.5 text-sm border transition ${
                      language === l.value
                        ? "bg-sky-500 text-white border-sky-500"
                        : "bg-white text-slate-700 border-slate-300 hover:border-sky-400"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {t("extraContext")}
              </span>
              <textarea
                value={extraContext}
                onChange={(e) => setExtraContext(e.target.value)}
                rows={3}
                placeholder={t("extraContextPlaceholder")}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">{t("tools")}</span>
              <input
                value={tools}
                onChange={(e) => setTools(e.target.value)}
                placeholder={t("toolsPlaceholder")}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </label>

            {/* Тип матеріалів */}
            <div>
              <span className="text-sm font-medium text-slate-700">{t("materialTypes")}</span>
              <div className="mt-1 space-y-2">
                {MATERIALS.map((m) => (
                  <label
                    key={m.value}
                    className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition ${
                      materialTypes.includes(m.value)
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-300 hover:border-sky-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={materialTypes.includes(m.value)}
                      onChange={() => toggleMaterial(m.value)}
                      className="mt-0.5 accent-sky-500"
                    />
                    <span className="text-sm">
                      <span className="font-medium text-slate-800">{t(m.labelKey)}</span>
                      <span className="block text-xs text-slate-500">{t(m.hintKey)}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={!canSubmit}
              onClick={generate}
              className="w-full rounded-lg bg-sky-500 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {phase === "generating" ? t("generating") : t("generate")}
            </button>
            {phase === "generating" && (
              <button
                type="button"
                onClick={stopGeneration}
                className="w-full rounded-lg border border-slate-300 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                {t("stop")}
              </button>
            )}
          </div>

          <GroupPanel lang={uiLang} group={group} onChange={setGroup} />
        </section>

        {/* РЕЗУЛЬТАТ */}
        <section className="rounded-xl bg-white shadow-sm border border-slate-200 flex flex-col min-h-[70vh]">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <h2 className="font-semibold text-slate-800">{t("result")}</h2>
            {output && (
              <div className="flex gap-2">
                <button
                  onClick={copyOutput}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
                >
                  {t("copy")}
                </button>
                <button
                  onClick={downloadMarkdown}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
                >
                  .md
                </button>
                <button
                  onClick={downloadDocx}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-white hover:bg-slate-700"
                >
                  {t("downloadDocx")}
                </button>
              </div>
            )}
          </div>

          <div ref={outputRef} className="flex-1 overflow-y-auto px-5 py-4">
            {statusMessage && (
              <p className="mb-3 text-sm text-sky-600 animate-pulse">{statusMessage}</p>
            )}
            {errorMessage && (
              <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {errorMessage}
              </p>
            )}
            {!output && phase === "idle" && (
              <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
                <p className="max-w-xs">{t("emptyResult")}</p>
              </div>
            )}
            {output && phase === "generating" && (
              <div className="prose-output text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
              </div>
            )}
            {output && phase !== "generating" && (
              <div className="space-y-4">
                <CompliancePanel
                  lang={uiLang}
                  lessonText={output}
                  discipline={discipline.trim()}
                  topic={topic.trim()}
                  language={language}
                  product={effectiveProduct || undefined}
                  programFileId={programFileId || undefined}
                  requestHeaders={requestHeaders}
                  hasCurriculum={Boolean(boundProgram || programFileId)}
                />
                <LessonEditor
                  lang={uiLang}
                  markdown={output}
                  onChange={setOutput}
                  requestHeaders={requestHeaders}
                  meta={{
                    discipline: discipline.trim(),
                    topic: topic.trim(),
                    duration,
                    format,
                    language,
                    product: effectiveProduct || undefined,
                    tools,
                    group,
                  }}
                />
              </div>
            )}
          </div>
        </section>
        </div>
      </main>
      )}

      <Footer lang={uiLang} />
    </div>
  );
}
