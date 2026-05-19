type PageEyebrowProps = {
  index: string;
  label: string;
};

export function PageEyebrow({ index, label }: PageEyebrowProps) {
  return (
    <div className="text-[14px] font-bold uppercase tracking-[0.08em]">
      <span className="text-primary">{index}</span>
      <span className="text-muted-foreground"> {label}</span>
    </div>
  );
}
