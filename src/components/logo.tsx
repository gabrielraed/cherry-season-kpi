export function CherryLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path
        d="M58 30 C 60 22, 68 20, 74 24 C 70 18, 71 12, 76 8"
        fill="none"
        stroke="#e0a08c"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M63 26 C 66 23, 70 23, 72 26"
        fill="none"
        stroke="#e0a08c"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M69 16 C 72 13, 76 13, 78 16"
        fill="none"
        stroke="#e0a08c"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="50" cy="58" r="34" fill="#eeab98" />
      <circle cx="50" cy="58" r="24" fill="#d94f2b" />
      <circle cx="50" cy="58" r="10" fill="#6b1f24" />
    </svg>
  );
}

export function CherrySeasonWordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className="font-bold text-[#6b1f24]">Cherry</span>
      <span className="font-bold text-[#d94f2b]">Season</span>
    </span>
  );
}
