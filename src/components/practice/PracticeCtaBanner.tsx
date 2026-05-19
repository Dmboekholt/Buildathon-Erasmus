import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen } from "lucide-react";

import { PracticeMountainIllustration } from "./PracticeMountainIllustration";

export function PracticeCtaBanner() {
  return (
    <section className="relative mt-12 overflow-hidden rounded-xl border border-[#fce4ec] bg-[#fdf2f4] px-8 py-6">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fce4ec]"
            aria-hidden
          >
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[16px] font-bold text-foreground">
              Keep building your skills.
            </p>
            <p className="mt-0.5 text-[14px] text-[#6b6b6b]">
              Consistent practice leads to confident decisions.
            </p>
          </div>
        </div>
        <Link
          to="/curriculum"
          className="relative z-10 inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#e4e4e4] bg-white px-5 py-2.5 text-[14px] font-bold text-foreground transition-colors hover:bg-[#fafafa]"
        >
          Open curriculum
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="pointer-events-none absolute bottom-0 right-6 hidden lg:block">
        <PracticeMountainIllustration />
      </div>
    </section>
  );
}
