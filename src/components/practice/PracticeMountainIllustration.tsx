export function PracticeMountainIllustration() {
  return (
    <svg
      viewBox="0 0 200 80"
      className="h-20 w-[200px] shrink-0"
      aria-hidden
    >
      <path
        d="M20 70 Q60 50 100 55 T180 45"
        fill="none"
        stroke="#f8bbd0"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M40 70 L70 35 L95 50 L120 25 L155 70 Z"
        fill="#fce4ec"
        stroke="#f8bbd0"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M95 50 L120 25 L140 45 L155 70 Z"
        fill="#f8bbd0"
        opacity="0.6"
      />
      <line
        x1="120"
        y1="25"
        x2="120"
        y2="12"
        stroke="#e40521"
        strokeWidth="2"
      />
      <path
        d="M120 12 L125 18 L115 18 Z"
        fill="#e40521"
      />
    </svg>
  );
}
