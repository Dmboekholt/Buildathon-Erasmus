type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
};

export function MetricCard({ label, value, hint, emphasis = false }: MetricCardProps) {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="text-caption text-muted-foreground">{label}</div>
      <div
        className={
          "mt-3 font-mono text-[28px] leading-none " +
          (emphasis ? "text-accent" : "text-foreground")
        }
      >
        {value}
      </div>
      {hint ? (
        <div className="mt-3 text-caption text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}
