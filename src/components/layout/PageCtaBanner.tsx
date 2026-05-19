import { Link } from "@tanstack/react-router";
import { ArrowRight, type LucideIcon } from "lucide-react";

type PageCtaBannerProps = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  linkTo: string;
  linkLabel: string;
};

export function PageCtaBanner({
  icon: Icon,
  title,
  subtitle,
  linkTo,
  linkLabel,
}: PageCtaBannerProps) {
  return (
    <section className="mt-12 flex flex-col items-start justify-between gap-6 rounded-lg border border-border bg-card px-8 py-6 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fce4ec]"
          aria-hidden
        >
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-[16px] font-bold text-foreground">{title}</p>
          <p className="mt-0.5 text-caption text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <Link
        to={linkTo}
        className="inline-flex shrink-0 items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-[14px] font-bold text-foreground transition-colors hover:bg-muted"
      >
        {linkLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
