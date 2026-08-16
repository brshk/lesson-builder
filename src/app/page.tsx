"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DIRECTIONS } from "@/lib/directions";
import DirectionCards from "@/components/DirectionCards";
import ProgramCards from "@/components/ProgramCards";
import { PROGRAM_PORTAL_SLUG } from "@/lib/portalMap";
import { driveRefFor, driveViewUrl } from "@/lib/programDrive";
import type { DriveProgram, Language, LessonFormat, MaterialType } from "@/lib/types";

const DURATIONS = [45, 60, 90, 120, 180] as const;

const FORMATS: { value: LessonFormat; label: string }[] = [
  { value: "offline", label: "Офлайн" },
  { value: "online", label: "Онлайн" },
  { value: "mixed", label: "Змішаний" },
];

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "uk", label: "Українська" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

type ProviderId = "free" | "gemini" | "openai" | "claude";

const PROVIDERS: {
  id: ProviderId;
  label: string;
  badge: string;
  placeholder: string;
  storageKey: string;
  keyUrl: string;
  keyUrlLabel: string;
  note: string;
  keyless?: boolean;
}[] = [
  {
    id: "free",
    label: "Без ключа",
    badge: "безкоштовно",
    placeholder: "",
    storageKey: "",
    keyUrl: "",
    keyUrlLabel: "",
    note: "",
    keyless: true,
  },
  {
    id: "gemini",
    label: "Gemini",
    badge: "безкоштовно",
    placeholder: "AIza…",
    storageKey: "gemini_api_key",
    keyUrl: "https://aistudio.google.com/apikey",
    keyUrlLabel: "aistudio.google.com/apikey",
    note: "Безкоштовний ключ без банківської картки: увійдіть Google-акаунтом → Create API key. Діє безкоштовний денний ліміт запитів.",
  },
  {
    id: "openai",
    label: "ChatGPT",
    badge: "платний ключ",
    placeholder: "sk-proj-…",
    storageKey: "openai_api_key",
    keyUrl: "https://platform.openai.com/api-keys",
    keyUrlLabel: "platform.openai.com/api-keys",
    note: "Потрібен акаунт OpenAI Platform із поповненим балансом (Billing, від $5). Підписка ChatGPT Plus для API не діє — це окремий баланс.",
  },
  {
    id: "claude",
    label: "Claude",
    badge: "платний ключ",
    placeholder: "sk-ant-…",
    storageKey: "anthropic_api_key",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyUrlLabel: "console.anthropic.com",
    note: "Потрібен баланс на акаунті Anthropic (Plans & Billing, від $5). Одна генерація ≈ $0.10–0.30.",
  },
];

const MATERIALS: { value: MaterialType; label: string; hint: string }[] = [
  { value: "scenario", label: "Детальний сценарій заняття", hint: "поетапний план з таймінгом і конспектом" },
  { value: "slides", label: "Опис слайдів презентації", hint: "вміст, візуал і нотатки для кожного слайда" },
  { value: "practice", label: "Практичне завдання", hint: "покрокова робота в аудиторії" },
  { value: "homework", label: "Домашнє завдання", hint: "3 рівні: простий, середній, складний" },
];

type Phase = "idle" | "generating" | "done" | "error";

export default function Home() {
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
  const boundProgram = driveRefFor(product);
  const [discipline, setDiscipline] = useState("");
  const [topic, setTopic] = useState("");
  const [durationChoice, setDurationChoice] = useState<string>("90");
  const [customDuration, setCustomDuration] = useState<string>("");
  const [format, setFormat] = useState<LessonFormat>("offline");
  const [language, setLanguage] = useState<Language>("uk");
  const [extraContext, setExtraContext] = useState("");
  const [tools, setTools] = useState("");
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>(["scenario"]);

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

  const generate = useCallback(async () => {
    setPhase("generating");
    setOutput("");
    setErrorMessage("");
    setStatusMessage("Готую запит…");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-provider": provider,
          ...(apiKey.trim() ? { "x-user-api-key": apiKey.trim() } : {}),
        },
        signal: controller.signal,
        body: JSON.stringify({
          directionId,
          product: product || undefined,
          discipline: discipline.trim(),
          topic: topic.trim(),
          duration,
          format,
          language,
          extraContext,
          tools,
          materialTypes,
          programFileId: programFileId || undefined,
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Помилка сервера (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const rawEvent of events) {
          const eventMatch = rawEvent.match(/^event: (.+)$/m);
          const dataMatch = rawEvent.match(/^data: (.+)$/m);
          if (!eventMatch || !dataMatch) continue;
          const eventName = eventMatch[1];
          let data: { text?: string; message?: string; error?: string } = {};
          try {
            data = JSON.parse(dataMatch[1]);
          } catch {
            continue;
          }
          if (eventName === "text" && data.text) {
            setOutput((prev) => prev + data.text);
            setStatusMessage("");
          } else if (eventName === "status" && data.message) {
            setStatusMessage(data.message);
          } else if (eventName === "error") {
            throw new Error(data.error || "Помилка генерації");
          } else if (eventName === "done") {
            setStatusMessage("");
          }
        }
      }
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
    apiKey, provider, directionId, product, discipline, topic,
    duration, format, language, extraContext, tools, materialTypes, programFileId,
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
      alert("Не вдалося створити DOCX");
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

  return (
    <div className="min-h-screen">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-5 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-lg">
            AI
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">AI Lesson Builder</h1>
            <p className="text-xs text-slate-400">
              Генератор навчальних матеріалів · IT STEP
            </p>
          </div>
        </div>
      </header>

      {step === "directions" && (
        <main className="mx-auto max-w-7xl px-4 py-10">
          <DirectionCards
            directions={DIRECTIONS}
            onSelect={(id) => {
              setDirectionId(id);
              setProduct("");
              setStep("programs");
            }}
          />
        </main>
      )}

      {step === "programs" && (
        <main className="mx-auto max-w-7xl px-4 py-10">
          <ProgramCards
            direction={currentDirection}
            onBack={() => setStep("directions")}
            onSelect={(p) => {
              setProduct(p);
              setStep("form");
            }}
          />
        </main>
      )}

      {step === "form" && (
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <button
            type="button"
            onClick={() => setStep("directions")}
            className="text-slate-500 hover:text-slate-800"
          >
            Напрямки
          </button>
          <span className="text-slate-300">/</span>
          <button
            type="button"
            onClick={() => setStep("programs")}
            className="text-slate-500 hover:text-slate-800"
          >
            {currentDirection.code}
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-800">
            {product || "Без прив'язки до програми"}
          </span>
          <button
            type="button"
            onClick={() => setStep("programs")}
            className="ml-1 rounded-md border border-slate-300 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100"
          >
            Змінити
          </button>
        </div>
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* ФОРМА */}
        <section className="space-y-5">
          <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200 space-y-3">
            <h2 className="font-semibold text-slate-800">AI-модель та ключ</h2>
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
                  {p.label}
                  <span
                    className={`block text-[11px] ${
                      provider === p.id ? "text-sky-100" : "text-slate-400"
                    }`}
                  >
                    {p.badge}
                  </span>
                </button>
              ))}
            </div>
            {providerInfo.keyless ? (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                🎁 Нічого налаштовувати не потрібно — генерація працює одразу за
                рахунок академії. Діє обмеження: кілька занять на добу з одного
                пристрою. Якщо ліміт вичерпано або потрібна вища якість — оберіть
                вкладку з власним ключем.
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
                    {showApiKey ? "Сховати" : "Показати"}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Ключ:{" "}
                  <a
                    href={providerInfo.keyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 underline"
                  >
                    {providerInfo.keyUrlLabel}
                  </a>
                  . {providerInfo.note} Ключ зберігається лише у вашому браузері.
                </p>
              </>
            )}
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200 space-y-4">
            <h2 className="font-semibold text-slate-800">Параметри заняття</h2>

            <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
              <p className="text-slate-500">
                Напрямок:{" "}
                <span className="font-medium text-slate-800">
                  {currentDirection.code} — {currentDirection.name}
                </span>
              </p>
              {product && (
                <p className="mt-0.5 text-slate-500">
                  Програма: <span className="font-medium text-slate-800">{product}</span>
                </p>
              )}
              {product && PROGRAM_PORTAL_SLUG[product] && (
                <p className="mt-1 text-xs text-emerald-700">
                  📄 Опис продукту з ПКО-порталу враховується при генерації
                </p>
              )}
              <button
                type="button"
                onClick={() => setStep("programs")}
                className="mt-1.5 text-xs text-sky-600 underline hover:text-sky-700"
              >
                Змінити напрямок або програму
              </button>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Дисципліна *</span>
              <input
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                placeholder="Напр.: Основи Python"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Тема заняття *</span>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Напр.: Робота зі списками та кортежами"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </label>

            {/* Програма навчання з Google Drive */}
            <div>
              <span className="text-sm font-medium text-slate-700">
                Програма навчання (Google Drive)
              </span>
              {boundProgram ? (
                <div className="mt-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  📘 Прив'язано:{" "}
                  <a
                    href={driveViewUrl(boundProgram)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline"
                  >
                    {boundProgram.fileName}
                  </a>
                  <span className="mt-0.5 block text-emerald-700">
                    Матеріали будуть згенеровані відповідно до цієї програми.
                  </span>
                </div>
              ) : (
                <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  Для цієї програми файл навчальної програми ще не прив'язано —
                  генерація працюватиме без нього.
                </p>
              )}
              {!boundProgram && driveConfigured && (
                <>
                  <input
                    value={programFilter}
                    onChange={(e) => setProgramFilter(e.target.value)}
                    placeholder="Пошук програми за назвою…"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  />
                  <select
                    value={programFileId}
                    onChange={(e) => setProgramFileId(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  >
                    <option value="">— без програми —</option>
                    {filteredPrograms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </>
              )}
              {!boundProgram && driveConfigured === null && (
                <p className="mt-1 text-xs text-slate-400">Завантажую список програм…</p>
              )}
            </div>

            {/* Тривалість */}
            <div>
              <span className="text-sm font-medium text-slate-700">Тривалість заняття</span>
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
                    {d} хв
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
                  Власне значення
                </button>
              </div>
              {durationChoice === "custom" && (
                <input
                  type="number"
                  min={15}
                  max={480}
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  placeholder="Тривалість у хвилинах"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                />
              )}
            </div>

            {/* Формат */}
            <div>
              <span className="text-sm font-medium text-slate-700">Формат заняття</span>
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
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Мова */}
            <div>
              <span className="text-sm font-medium text-slate-700">
                Мова генерування матеріалів
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
                Додатковий контекст та побажання
              </span>
              <textarea
                value={extraContext}
                onChange={(e) => setExtraContext(e.target.value)}
                rows={3}
                placeholder="Особливості групи, рівень студентів, акценти…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Необхідні інструменти</span>
              <input
                value={tools}
                onChange={(e) => setTools(e.target.value)}
                placeholder="Напр.: VS Code, Python 3.12, Figma…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </label>

            {/* Тип матеріалів */}
            <div>
              <span className="text-sm font-medium text-slate-700">Тип заняття / матеріалів</span>
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
                      <span className="font-medium text-slate-800">{m.label}</span>
                      <span className="block text-xs text-slate-500">{m.hint}</span>
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
              {phase === "generating" ? "Генерую…" : "Згенерувати матеріали"}
            </button>
            {phase === "generating" && (
              <button
                type="button"
                onClick={stopGeneration}
                className="w-full rounded-lg border border-slate-300 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                Зупинити
              </button>
            )}
          </div>
        </section>

        {/* РЕЗУЛЬТАТ */}
        <section className="rounded-xl bg-white shadow-sm border border-slate-200 flex flex-col min-h-[70vh]">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <h2 className="font-semibold text-slate-800">Результат</h2>
            {output && (
              <div className="flex gap-2">
                <button
                  onClick={copyOutput}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
                >
                  Копіювати
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
                  Завантажити .docx
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
                <p>
                  Заповніть параметри заняття зліва та натисніть
                  <br />
                  «Згенерувати матеріали»
                </p>
              </div>
            )}
            {output && (
              <div className="prose-output text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
              </div>
            )}
          </div>
        </section>
        </div>
      </main>
      )}
    </div>
  );
}
