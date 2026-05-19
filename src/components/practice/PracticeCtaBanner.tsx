import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen } from "lucide-react";

export function PracticeCtaBanner() {
  return (
    <section className="mt-12 rounded-xl border border-primary/20 bg-primary/10 px-8 py-6">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card"
            aria-hidden
          >
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[16px] font-bold text-foreground">
              Keep building your skills.
            </p>
            <p className="mt-0.5 text-[14px] text-muted-foreground">
              Consistent practice leads to confident decisions.
            </p>
          </div>
        </div>
        <Link
          to="/curriculum"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-[14px] font-bold text-foreground transition-colors hover:bg-muted"
        >
          Open curriculum
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
