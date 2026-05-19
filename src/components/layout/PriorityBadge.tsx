type PriorityBadgeProps = {
  priority: string;
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const label = priority.toUpperCase();
  if (label === "HIGH") {
    return (
      <span className="shrink-0 rounded-full bg-[#fce4ec] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-primary">
        HIGH
      </span>
    );
  }
  if (label === "MEDIUM") {
    return (
      <span className="shrink-0 rounded-full bg-[#fff3e0] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#e65100]">
        MEDIUM
      </span>
    );
  }
  if (label === "LOW") {
    return (
      <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
        LOW
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
      {priority}
    </span>
  );
}
