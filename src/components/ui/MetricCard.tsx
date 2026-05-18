export function MetricCard({
  label,
  value,
  suffix,
  delta,
  hint,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  delta?: { value: string; tone?: "up" | "down" | "neutral" };
  hint?: string;
}) {
  const toneClass =
    delta?.tone === "up"
      ? "text-[color:var(--color-success)]"
      : delta?.tone === "down"
        ? "text-[color:var(--color-danger)]"
        : "text-muted-foreground";

  return (
    <div className="rounded-md border border-border bg-card px-5 py-4">
      <div className="eyebrow">{label}</div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="font-mono text-[28px] leading-none text-foreground">
          {value}
          {suffix && (
            <span className="ml-1 text-caption text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
        {delta && (
          <span className={`font-mono text-caption ${toneClass}`}>
            {delta.value}
          </span>
        )}
      </div>
      {hint && (
        <div className="mt-2 text-caption text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}
