export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="64" height="64" rx="16" fill="var(--primary)" />
      <path
        d="M17 19L30 46L41 24"
        stroke="var(--primary-fg)"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="46" cy="20" r="6" fill="var(--accent)" />
    </svg>
  );
}
