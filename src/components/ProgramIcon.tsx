/**
 * Іконка програми замість літерного бейджа.
 *
 * Тип підбирається за ключовими словами в назві — так нові програми з Drive
 * одразу отримують доречну іконку без правок коду. Колір прив'язаний до типу,
 * а не до напрямку: на одній сторінці ПКО код, дизайн і кібербезпека мають
 * бути різними за кольором, як у каталозі порталу.
 */
export type ProgramIconKind =
  | "code"
  | "qa"
  | "design"
  | "security"
  | "school"
  | "game"
  | "cube"
  | "video"
  | "marketing"
  | "ai"
  | "robot"
  | "art"
  | "web"
  | "data"
  | "language"
  | "camp"
  | "star";

const TONE: Record<ProgramIconKind, string> = {
  code: "bg-sky-500",
  qa: "bg-emerald-600",
  web: "bg-cyan-500",
  data: "bg-lime-600",
  game: "bg-green-500",
  design: "bg-violet-500",
  art: "bg-purple-500",
  ai: "bg-fuchsia-500",
  video: "bg-pink-500",
  security: "bg-rose-500",
  marketing: "bg-amber-500",
  cube: "bg-orange-500",
  robot: "bg-teal-500",
  school: "bg-indigo-500",
  language: "bg-blue-500",
  camp: "bg-green-700",
  star: "bg-slate-400",
};

/** Порядок важливий: перше збігання виграє, тому вузьке — вище за широке. */
const RULES: { kind: ProgramIconKind; re: RegExp }[] = [
  { kind: "security", re: /кібербезпек|cyber|хакінг|hacking|безпек/i },
  { kind: "qa", re: /тестувальник|\bqa\b/i },
  { kind: "game", re: /гейм|game|ігор|ігров|roblox|unity|minecraft|arcade|kodu|struckd/i },
  { kind: "cube", re: /3d|blender|скульптинг|моделюванн|мейкер|інтер'єр|интерьер|\bar\b|\bvr\b/i },
  { kind: "video", re: /motion|відео|video|reels|анімац|мультиплікац|cinemagic|блогінг|photolab|фото/i },
  { kind: "art", re: /ілюстрац|illustration|concept art|digitalart|digital art|мегаарт|мистецтв|art direction|\bart\b/i },
  { kind: "design", re: /дизайн|design|figma|ui\/ux|uiux|canva|типологія|графік|graphic/i },
  { kind: "robot", re: /робот|arduino|мікробіт|microbit|gadget|smarttech|smart gadgets|інноваційн/i },
  { kind: "data", re: /data|аналіт|analytics|статистик/i },
  { kind: "marketing", re: /маркет|market|ads|таргет|smm|реклам|стартап|фріланс/i },
  { kind: "web", re: /web|веб|сайт|codecraft|codeart/i },
  { kind: "code", re: /python|код|code|розробк|developer|devops|програмуванн|scratch|вайб|vibe|front-?end|full-?stack/i },
  { kind: "language", re: /англійськ|english|step2talk/i },
  { kind: "camp", re: /табір|табори|camp/i },
  {
    kind: "school",
    re: /школ|school|коледж|university|університет|вища освіта|клас|академі|перший крок|it start|іт старт|legokids|корпоративн|індивідуальн|спецкурс/i,
  },
  { kind: "ai", re: /\bai\b|штучний інтелект|нейро|assistant|generative|інтелект|бізнес|business/i },
];

export function iconKindFor(name: string): ProgramIconKind {
  for (const r of RULES) if (r.re.test(name)) return r.kind;
  return "star";
}

function Glyph({ kind }: { kind: ProgramIconKind }) {
  const p = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (kind) {
    case "qa":
      return (
        <svg {...p}>
          <path d="M9 3.5h6a1 1 0 0 1 1 1v1H8v-1a1 1 0 0 1 1-1Z" />
          <path d="M16 5.5h2.5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1H8" />
          <path d="m9 13 2.2 2.2L15.5 11" />
        </svg>
      );
    case "code":
      return (
        <svg {...p}>
          <path d="m8 17-5-5 5-5M16 7l5 5-5 5M14 4l-4 16" />
        </svg>
      );
    case "design":
      return (
        <svg {...p}>
          <path d="M12 3 8.5 10.5h7L12 3Z" />
          <path d="M12 10.5V21" />
          <path d="M9.5 21h5" />
        </svg>
      );
    case "security":
      return (
        <svg {...p}>
          <path d="M12 3 5 6v6c0 4 3 7.4 7 9 4-1.6 7-5 7-9V6l-7-3Z" />
          <path d="M12 11v3" />
          <circle cx="12" cy="9" r="0.6" fill="currentColor" />
        </svg>
      );
    case "school":
      return (
        <svg {...p}>
          <path d="M22 9 12 4 2 9l10 5 10-5Z" />
          <path d="M6 11.5V16c0 1.1 2.7 2.5 6 2.5s6-1.4 6-2.5v-4.5" />
        </svg>
      );
    case "game":
      return (
        <svg {...p}>
          <rect x="2.5" y="7.5" width="19" height="9" rx="4.5" />
          <path d="M7 10.5v3M5.5 12h3M15.5 11.5h.01M18 13.5h.01" />
        </svg>
      );
    case "cube":
      return (
        <svg {...p}>
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
        </svg>
      );
    case "video":
      return (
        <svg {...p}>
          <rect x="2.5" y="5.5" width="13" height="13" rx="2.5" />
          <path d="m15.5 10 6-3.5v11l-6-3.5" />
        </svg>
      );
    case "marketing":
      return (
        <svg {...p}>
          <path d="M3.5 10v4a1 1 0 0 0 1 1H7l6 4V5L7 9H4.5a1 1 0 0 0-1 1Z" />
          <path d="M17 9.5a4 4 0 0 1 0 5" />
        </svg>
      );
    case "ai":
      return (
        <svg {...p}>
          <path d="m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3Z" />
          <path d="M18 16.5 18.8 18.5 20.8 19.3 18.8 20.1 18 22.1 17.2 20.1 15.2 19.3 17.2 18.5Z" />
        </svg>
      );
    case "robot":
      return (
        <svg {...p}>
          <rect x="4.5" y="8" width="15" height="11" rx="3" />
          <path d="M12 4.5V8M9 13h.01M15 13h.01M9.5 16h5" />
        </svg>
      );
    case "art":
      return (
        <svg {...p}>
          <path d="M12 3.5c-4.7 0-8.5 3.6-8.5 8 0 3 2.4 4.7 4.6 4.7 1.6 0 2.1.9 2.1 1.9 0 1.3 1 2.4 2.3 2.4 4 0 8-3.4 8-8.5 0-4.7-3.8-8.5-8.5-8.5Z" />
          <circle cx="8.4" cy="10" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="12" cy="7.8" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="15.7" cy="10" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "web":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17M12 3.5c2.2 2.4 3.4 5.4 3.4 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.4-5.4-3.4-8.5S9.8 5.9 12 3.5Z" />
        </svg>
      );
    case "data":
      return (
        <svg {...p}>
          <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        </svg>
      );
    case "language":
      return (
        <svg {...p}>
          <path d="M4 6h10M9 4v2M11.5 6c-.6 4.2-3.4 7.6-7 9" />
          <path d="M6.5 11c1.4 2.3 3.5 4 6 5M13 20l4-9 4 9M14.6 17h4.8" />
        </svg>
      );
    case "camp":
      return (
        <svg {...p}>
          <path d="m12 4 8 15H4l8-15Z" />
          <path d="m12 10-4.5 9M12 10l4.5 9" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <path d="m12 3.5 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.9l6-.8L12 3.5Z" />
        </svg>
      );
  }
}

export default function ProgramIcon({
  name,
  size = 40,
}: {
  name: string;
  size?: number;
}) {
  const kind = iconKindFor(name);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl text-white ${TONE[kind]}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Glyph kind={kind} />
    </span>
  );
}
