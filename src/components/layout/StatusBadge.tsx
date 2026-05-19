type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "passed") {
    return (
      <span className="shrink-0 rounded-full bg-[#e8f5e9] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#2e7d32]">
        PASSED
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="shrink-0 rounded-full bg-[#fff3e0] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#e65100]">
        IN PROGRESS
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
      NOT STARTED
    </span>
  );
}
