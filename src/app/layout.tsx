import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Lesson Builder — генератор навчальних матеріалів",
  description:
    "Генерація навчальних матеріалів для викладачів IT STEP: сценарії занять, слайди, практичні та домашні завдання. Інтерфейс: українська / русский / English.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body className="antialiased bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
