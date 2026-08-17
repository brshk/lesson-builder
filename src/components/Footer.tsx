"use client";

import Logo from "./Logo";
import { tr, type UiLang } from "@/lib/i18n";

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.7 3.4 2.9 10.7c-1.1.4-1.1 1.1-.2 1.4l4.8 1.5 1.8 5.6c.2.6.4.8.8.8.4 0 .6-.2 1-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.2-.5-1.8-1.2-1.5ZM8.7 13.9l10-6.3c.5-.3.9-.1.6.2l-8.6 7.8-.3 3.6-1.7-5.3Z" />
    </svg>
  );
}

export default function Footer({ lang = "uk" }: { lang?: UiLang }) {
  const year = 2026;
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-7 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <Logo size={34} id="lb-foot" />
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-slate-800">
              {tr(lang, "appTitle")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {tr(lang, "footerRights")}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              {tr(lang, "footerDisclaimer")}
            </p>
          </div>
        </div>

        <div className="sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {tr(lang, "footerContact")}
          </p>
          <div className="mt-2 flex gap-2 sm:justify-end">
            <a
              href="https://www.instagram.com/borsch.edtech/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-sky-400 hover:text-sky-600"
            >
              <InstagramIcon />
              Instagram
            </a>
            <a
              href="https://t.me/borschedtech"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-sky-400 hover:text-sky-600"
            >
              <TelegramIcon />
              Telegram
            </a>
          </div>
          <p className="mt-2.5 text-xs text-slate-400">
            © {year} Vitalii BORSHCHUK
          </p>
        </div>
      </div>
    </footer>
  );
}
