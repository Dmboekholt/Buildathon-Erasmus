type Props = {
  className?: string;
  compact?: boolean;
};

/**
 * BDO-style wordmark. Bold navy "BDO" with a small red square accent.
 * Pure SVG — no asset dependency, scales crisp at any size.
 */
export function BdoLogo({ className, compact }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${className ?? ""}`}
      aria-label="BDO Insight"
    >
      <svg
        viewBox="0 0 96 32"
        className="h-7 w-auto"
        role="img"
        aria-hidden="true"
      >
        <text
          x="0"
          y="25"
          fill="#1A2B4A"
          fontFamily="Archivo, Inter, sans-serif"
          fontWeight="900"
          fontSize="28"
          letterSpacing="-0.5"
        >
          BDO
        </text>
        <rect x="80" y="20" width="10" height="10" fill="#E40521" />
      </svg>
      {!compact && (
        <span className="text-[15px] font-bold uppercase tracking-[0.08em] text-foreground">
          Insight
        </span>
      )}
    </span>
  );
}
