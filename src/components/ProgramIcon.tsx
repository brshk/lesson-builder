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
    width: 21,
    height: 21,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (kind) {
    // програмування — кутові дужки коду
    case "code":
      return (
        <svg {...p}>
          <path d="m8 6-6 6 6 6M16 6l6 6-6 6M14 3.5l-4 17" />
        </svg>
      );

    // тестування — чек-ліст із галочкою
    case "qa":
      return (
        <svg {...p}>
          <rect x="8.5" y="2.5" width="7" height="4" rx="1.3" />
          <path d="M15.5 4.5h2.5A1.5 1.5 0 0 1 19.5 6v13.5a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 6 4.5h2.5" />
          <path d="m9 13.5 2.2 2.2 4.3-4.7" />
        </svg>
      );

    // дизайн — палітра з фарбами
    case "design":
      return (
        <svg {...p}>
          <path d="M12 2.8c-5.1 0-9.2 4.1-9.2 9.2s4.1 9.2 9.2 9.2c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.6-.4-1a1.6 1.6 0 0 1 1.6-1.6h1.9c2.9 0 5.3-2.4 5.3-5.3 0-4.4-4.3-7.8-9.6-7.8Z" />
          <circle cx="7.7" cy="12.2" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="9.4" cy="8.1" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="13.8" cy="7.2" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="17.2" cy="10" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      );

    // ілюстрація та цифровий арт — зображення в рамці
    case "art":
      return (
        <svg {...p}>
          <rect x="3" y="3.5" width="18" height="17" rx="2.6" />
          <circle cx="8.6" cy="9.2" r="1.7" />
          <path d="m3.4 17.5 4.9-4.3a2 2 0 0 1 2.7.05L16 18" />
          <path d="m13.7 15.4 2.2-2a2 2 0 0 1 2.7.03l2 1.9" />
        </svg>
      );

    // кібербезпека — щит із замком
    case "security":
      return (
        <svg {...p}>
          <path d="M12 2.8 4.8 5.9v5.6c0 4.3 3.1 8.3 7.2 9.7 4.1-1.4 7.2-5.4 7.2-9.7V5.9L12 2.8Z" />
          <rect x="9.4" y="10.6" width="5.2" height="4.6" rx="1.1" />
          <path d="M10.7 10.6V9.4a1.3 1.3 0 0 1 2.6 0v1.2" />
        </svg>
      );

    // школи та академії — академічна шапочка
    case "school":
      return (
        <svg {...p}>
          <path d="M21.5 8.6 12 4.2 2.5 8.6 12 13l9.5-4.4Z" />
          <path d="M6.3 10.6v4.6c0 1.5 2.6 2.7 5.7 2.7s5.7-1.2 5.7-2.7v-4.6" />
          <path d="M21.5 8.6v5.2" />
        </svg>
      );

    // ігри — геймпад
    case "game":
      return (
        <svg {...p}>
          <path d="M8.5 7.5h7a5.5 5.5 0 0 1 5.5 5.5v.6a3.4 3.4 0 0 1-6.1 2.1l-.6-.8h-4.6l-.6.8A3.4 3.4 0 0 1 3 13.6V13a5.5 5.5 0 0 1 5.5-5.5Z" />
          <path d="M7.4 11.2v2.4M6.2 12.4h2.4" />
          <circle cx="15.6" cy="11.6" r=".95" fill="currentColor" stroke="none" />
          <circle cx="17.6" cy="13.6" r=".95" fill="currentColor" stroke="none" />
        </svg>
      );

    // 3D та моделювання — куб
    case "cube":
      return (
        <svg {...p}>
          <path d="m12 2.8 8.4 4.7v9.4L12 21.2l-8.4-4.3V7.5L12 2.8Z" />
          <path d="m3.6 7.5 8.4 4.7 8.4-4.7M12 12.2v9" />
        </svg>
      );

    // відео та motion — хлопавка
    case "video":
      return (
        <svg {...p}>
          <rect x="2.8" y="4.6" width="18.4" height="15" rx="2.4" />
          <path d="M2.8 9.4h18.4" />
          <path d="m6.6 4.7 1.9 4.6M12 4.7l1.9 4.6M17.4 4.7l1.9 4.6" />
          <path d="m10.6 12.6 4.4 2.4-4.4 2.4v-4.8Z" />
        </svg>
      );

    // маркетинг — мегафон
    case "marketing":
      return (
        <svg {...p}>
          <path d="M4.2 10.2v3.6a1.2 1.2 0 0 0 1.2 1.2h2.1l8.4 4.4V4.6L7.5 9H5.4a1.2 1.2 0 0 0-1.2 1.2Z" />
          <path d="M7.5 15v3.7a1.2 1.2 0 0 0 1.2 1.2h1.4a1.2 1.2 0 0 0 1.2-1.2v-1.9" />
          <path d="M18.8 9.6a3.6 3.6 0 0 1 0 4.8" />
        </svg>
      );

    // штучний інтелект — іскри
    case "ai":
      return (
        <svg {...p}>
          <path d="m11 3 1.75 4.75L17.5 9.5l-4.75 1.75L11 16l-1.75-4.75L4.5 9.5l4.75-1.75L11 3Z" />
          <path d="m18 14 .95 2.3 2.3.95-2.3.95L18 20.5l-.95-2.3-2.3-.95 2.3-.95L18 14Z" />
        </svg>
      );

    // робототехніка — робот
    case "robot":
      return (
        <svg {...p}>
          <rect x="4.4" y="8" width="15.2" height="11.4" rx="3" />
          <path d="M12 4.6V8" />
          <circle cx="12" cy="3.5" r="1.2" />
          <circle cx="9.2" cy="12.8" r="1.05" fill="currentColor" stroke="none" />
          <circle cx="14.8" cy="12.8" r="1.05" fill="currentColor" stroke="none" />
          <path d="M9.6 16.2h4.8M2.6 12.2v3M21.4 12.2v3" />
        </svg>
      );

    // веб — глобус
    case "web":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3.2 9.5h17.6M3.2 14.5h17.6" />
          <path d="M12 3c2.4 2.5 3.6 5.6 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.6-3.6-9S9.6 5.5 12 3Z" />
        </svg>
      );

    // аналітика — графік зростання
    case "data":
      return (
        <svg {...p}>
          <path d="M3.5 3.5v17h17" />
          <path d="m7 15.5 3.6-4.2 3 2.7 5.4-6.2" />
          <path d="M15.6 7.8h4.4v4.3" />
        </svg>
      );

    // мови — переклад
    case "language":
      return (
        <svg {...p}>
          <path d="M3.4 6.2h9.2M8 4.1v2.1M11 6.2c-.6 4.4-3.5 8-7.3 9.5" />
          <path d="M6.2 11.4c1.4 2.4 3.6 4.2 6.2 5.2" />
          <path d="m12.8 20.4 4.1-9.3 4.1 9.3M14.5 17.1h4.8" />
        </svg>
      );

    // табори — намет
    case "camp":
      return (
        <svg {...p}>
          <path d="m12 3.6 9 16.4H3l9-16.4Z" />
          <path d="m12 10.6-3.7 9.4M12 10.6l3.7 9.4" />
        </svg>
      );

    // за замовчуванням — розгорнутий конспект
    default:
      return (
        <svg {...p}>
          <path d="M12 6.6c-1.8-1.4-4.2-2.1-6.9-2.1H3v13.4h2.1c2.7 0 5.1.7 6.9 2.1 1.8-1.4 4.2-2.1 6.9-2.1H21V4.5h-2.1c-2.7 0-5.1.7-6.9 2.1Z" />
          <path d="M12 6.6v13.4" />
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
