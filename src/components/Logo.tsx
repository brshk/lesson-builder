/**
 * Знак AI Lesson Builder: розгорнутий конспект + AI-іскра.
 * `id` має бути унікальним на сторінці — SVG-градієнт адресується через url(#id),
 * а знак виводиться двічі (шапка й футер).
 */
export default function Logo({
  size = 40,
  id = "lb",
}: {
  size?: number;
  id?: string;
}) {
  const g = `${id}-grad`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="52%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>

      <rect width="40" height="40" rx="11" fill={`url(#${g})`} />

      {/* розгорнутий конспект: ліва сторінка яскравіша, права — трохи приглушена */}
      <path
        d="M20 15.6c-1.8-1.5-4.2-2.3-6.9-2.3H9.4c-.6 0-1.1.5-1.1 1.1v12.9c0 .6.5 1.1 1.1 1.1h3.7c2.7 0 5.1.8 6.9 2.3Z"
        fill="#fff"
      />
      <path
        d="M20 15.6c1.8-1.5 4.2-2.3 6.9-2.3h3.7c.6 0 1.1.5 1.1 1.1v12.9c0 .6-.5 1.1-1.1 1.1h-3.7c-2.7 0-5.1.8-6.9 2.3Z"
        fill="#fff"
        opacity="0.82"
      />
      {/* корінець */}
      <path d="M20 15.6v15.1" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" />

      {/* AI-іскра */}
      <path
        d="M29.2 4.1 30.4 7.1 33.4 8.3 30.4 9.5 29.2 12.5 28 9.5 25 8.3 28 7.1Z"
        fill="#fff"
      />
      <circle cx="23.4" cy="6.2" r="1.05" fill="#fff" opacity="0.75" />
    </svg>
  );
}
