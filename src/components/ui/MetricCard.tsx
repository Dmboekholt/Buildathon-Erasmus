export function MetricCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card px-5 py-4">
      <div className="text-caption text-muted-foreground">{label}</div>
      <div className="mt-2 font-mono text-[28px] leading-none text-foreground">
        {value}
        {suffix && (
          <span className="ml-1 text-caption text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
