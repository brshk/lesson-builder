"use client";

import { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cleanEditedBlock, joinBlocks, splitBlocks } from "@/lib/blocks";
import { streamSse } from "@/lib/sseClient";
import { tr, type UiKey, type UiLang } from "@/lib/i18n";
import type { EditAction, EditRequest, GroupContext, Language, LessonFormat } from "@/lib/types";

/** Дев'ять швидких дій біля кожного блоку. */
const ACTIONS: { id: EditAction; key: UiKey; icon: string }[] = [
  { id: "simpler", key: "actSimpler", icon: "↓" },
  { id: "harder", key: "actHarder", icon: "↑" },
  { id: "more-practice", key: "actMorePractice", icon: "🛠" },
  { id: "shorter", key: "actShorter", icon: "✂" },
  { id: "add-game", key: "actAddGame", icon: "🎲" },
  { id: "adapt-online", key: "actAdaptOnline", icon: "💻" },
  { id: "adapt-offline", key: "actAdaptOffline", icon: "🏫" },
  { id: "replace-paid", key: "actReplacePaid", icon: "🆓" },
  { id: "regenerate", key: "actRegenerate", icon: "↻" },
];

export interface LessonMeta {
  discipline: string;
  topic: string;
  duration: number;
  format: LessonFormat;
  language: Language;
  product?: string;
  tools?: string;
  group?: GroupContext;
}

export default function LessonEditor({
  lang,
  markdown,
  onChange,
  meta,
  requestHeaders,
  disabled,
}: {
  lang: UiLang;
  markdown: string;
  onChange: (next: string) => void;
  meta: LessonMeta;
  requestHeaders: Record<string, string>;
  disabled?: boolean;
}) {
  const blocks = useMemo(() => splitBlocks(markdown), [markdown]);
  const outline = useMemo(
    () => blocks.filter((b) => b.level > 0).map((b) => b.heading),
    [blocks]
  );

  const [busyBlockId, setBusyBlockId] = useState<string | null>(null);
  const [docBusy, setDocBusy] = useState(false);
  const [buffer, setBuffer] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [chat, setChat] = useState("");
  const [chatTarget, setChatTarget] = useState("__doc__");
  const abortRef = useRef<AbortController | null>(null);

  const busy = Boolean(busyBlockId) || docBusy;

  const run = async (req: EditRequest, blockId: string | null) => {
    setError("");
    setBuffer("");
    if (blockId) setBusyBlockId(blockId);
    else setDocBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let acc = "";

    try {
      await streamSse(
        "/api/edit",
        req,
        requestHeaders,
        {
          onText: (t) => {
            acc += t;
            setBuffer(acc);
          },
        },
        controller.signal
      );

      const cleaned = cleanEditedBlock(acc, req.blockHeading);
      if (!cleaned) throw new Error(tr(lang, "genError"));

      setHistory((h) => [markdown, ...h].slice(0, 20));

      if (req.scope === "document") {
        onChange(cleaned);
      } else {
        onChange(
          joinBlocks(blocks.map((b) => (b.id === blockId ? { ...b, text: cleaned } : b)))
        );
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setBusyBlockId(null);
      setDocBusy(false);
      setBuffer("");
      abortRef.current = null;
    }
  };

  const applyAction = (blockId: string, action: EditAction) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    run(
      {
        ...meta,
        action,
        scope: "block",
        blockText: block.text,
        blockHeading: block.heading,
        outline,
      },
      blockId
    );
  };

  const applyChat = () => {
    const instruction = chat.trim();
    if (!instruction) return;
    setChat("");
    if (chatTarget === "__doc__") {
      run({ ...meta, instruction, scope: "document", documentText: markdown, outline }, null);
    } else {
      const block = blocks.find((b) => b.id === chatTarget);
      if (!block) return;
      run(
        {
          ...meta,
          instruction,
          scope: "block",
          blockText: block.text,
          blockHeading: block.heading,
          outline,
        },
        block.id
      );
    }
  };

  const undo = () => {
    const [prev, ...rest] = history;
    if (prev === undefined) return;
    onChange(prev);
    setHistory(rest);
  };

  return (
    <div className="space-y-4">
      {/* чат-панель */}
      <div className="sticky top-0 z-10 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-700">✨ {tr(lang, "editorTitle")}</span>
          {history.length > 0 && (
            <button
              type="button"
              onClick={undo}
              disabled={busy}
              className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
            >
              ↩ {tr(lang, "undo")} ({history.length})
            </button>
          )}
        </div>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <select
            value={chatTarget}
            onChange={(e) => setChatTarget(e.target.value)}
            disabled={busy}
            title={tr(lang, "chatTarget")}
            className="max-w-[190px] shrink-0 rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-sky-500 focus:outline-none"
          >
            <option value="__doc__">{tr(lang, "wholeLesson")}</option>
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.heading.slice(0, 46)}
              </option>
            ))}
          </select>
          <input
            value={chat}
            onChange={(e) => setChat(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                applyChat();
              }
            }}
            disabled={busy || disabled}
            placeholder={tr(lang, "chatPlaceholder")}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={applyChat}
            disabled={busy || disabled || !chat.trim()}
            className="shrink-0 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-600 disabled:opacity-40"
          >
            {tr(lang, "chatApply")}
          </button>
        </div>

        {docBusy && (
          <p className="mt-2 animate-pulse text-xs text-sky-600">{tr(lang, "editingDoc")}</p>
        )}
        {error && (
          <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-600">{error}</p>
        )}
        <p className="mt-1.5 text-[11px] text-slate-400">{tr(lang, "editorHint")}</p>
      </div>

      {/* документ поблоково */}
      {docBusy && buffer ? (
        <div className="prose-output text-sm opacity-70">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{buffer}</ReactMarkdown>
        </div>
      ) : (
        blocks.map((b) => {
          const isBusy = busyBlockId === b.id;
          return (
            <section
              key={b.id}
              className={`group relative rounded-xl border px-3 py-1 transition ${
                isBusy ? "border-sky-300 bg-sky-50/40" : "border-transparent hover:border-slate-200 hover:bg-slate-50/60"
              }`}
            >
              <div
                className={`flex flex-wrap gap-1 pb-1 pt-2 transition ${
                  isBusy ? "" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
                }`}
              >
                {ACTIONS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => applyAction(b.id, a.id)}
                    disabled={busy || disabled}
                    className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[11px] text-slate-600 transition hover:border-sky-400 hover:text-sky-600 disabled:opacity-40"
                  >
                    <span aria-hidden="true">{a.icon}</span> {tr(lang, a.key)}
                  </button>
                ))}
              </div>

              {isBusy ? (
                <div className="prose-output text-sm">
                  <p className="mb-2 animate-pulse text-xs text-sky-600">
                    {tr(lang, "editingBlock")}
                  </p>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {buffer || b.text}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="prose-output text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{b.text}</ReactMarkdown>
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
