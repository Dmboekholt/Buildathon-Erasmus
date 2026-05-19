import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight } from "lucide-react";

import { getActiveJuniorId } from "@/hooks/use-workspace";
import { listCurriculum } from "@/lib/curriculum.functions";

export const Route = createFileRoute("/_app/curriculum")({
  component: CurriculumPage,
});

function CurriculumPage() {
  const juniorId = getActiveJuniorId();
  const fetchCurriculum = useServerFn(listCurriculum);
  const { data, isLoading } = useQuery({
    queryKey: ["curriculum", juniorId],
    queryFn: () => fetchCurriculum({ data: { analystId: juniorId } }),
  });

  const level = data?.level ?? 1;
  const cases = data?.cases ?? [];

  return (
    <div className="mx-auto max-w-[1280px] py-20 px-[60px]">
      <header className="mb-16">
        <div className="eyebrow mb-5">Netherlands · Learning</div>
        <h1 className="text-[44px] font-bold leading-[1.05] tracking-[-0.015em] text-foreground">
          Historical case studies,
          <br />
          built into your training.
        </h1>
        <p className="mt-6 max-w-xl text-body text-foreground">
          Work through real deals from the archive. Answer the questions, get
          scored against expected insights, and level up as your accuracy
          climbs.
        </p>
      </header>

      <div className="mb-10 flex items-baseline justify-between border-t-2 border-foreground pt-6">
        <div>
          <div className="eyebrow">01 Progress</div>
          <h2 className="mt-2 text-[24px] font-bold leading-tight text-foreground">
            Analyst level {String(level).padStart(2, "0")}
          </h2>
        </div>
        <span className="text-caption text-muted-foreground">
          {String(cases.length).padStart(2, "0")} assignments
        </span>
      </div>

      {isLoading ? (
        <p className="text-body text-muted-foreground">Loading assignments.</p>
      ) : cases.length === 0 ? (
        <p className="text-body text-muted-foreground">
          No assignments available yet.
        </p>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cases.map((c) => (
            <Link
              key={c.id}
              to="/curriculum/$caseId"
              params={{ caseId: c.id }}
              className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-8 transition-colors hover:bg-muted"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-[20px] font-bold leading-tight text-foreground">
                  {c.title}
                </h3>
                <span className="shrink-0 text-[14px] font-bold uppercase tracking-[0.08em] text-primary">
                  L{c.difficulty}
                </span>
              </div>
              <div className="flex items-center gap-2 text-caption text-muted-foreground">
                {c.industry && (
                  <span className="font-bold text-foreground">
                    {c.industry}
                  </span>
                )}
                {c.industry && c.era && <span aria-hidden="true">·</span>}
                {c.era && <span>{c.era}</span>}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-caption text-muted-foreground">
                  {c.bestScore !== null
                    ? `Best score ${c.bestScore}/100`
                    : "Not started"}
                </span>
                <ArrowRight className="h-4 w-4 text-foreground transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
