import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronRight, GraduationCap } from "lucide-react";

import { PageCtaBanner } from "@/components/layout/PageCtaBanner";
import { PageEyebrow } from "@/components/layout/PageEyebrow";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { CURRICULUM_CAREER_LEVELS } from "@/config/curriculum-career";
import { useWorkspace } from "@/hooks/use-workspace";
import { listCurriculum } from "@/lib/curriculum.functions";

export const Route = createFileRoute("/_app/curriculum/")({
  component: CurriculumIndexPage,
});

function CurriculumIndexPage() {
  const { juniorId } = useWorkspace();
  const fetchCurriculum = useServerFn(listCurriculum);

  const { data, isLoading } = useQuery({
    queryKey: ["curriculum", juniorId],
    queryFn: () => fetchCurriculum({ data: { analystId: juniorId } }),
  });

  const level = data?.level ?? 1;
  const levelLabel = data?.levelLabel ?? "Analyst Basics";
  const cases = data?.cases ?? [];
  const rolling = data?.rollingWindow;

  return (
    <div className="mx-auto max-w-[1280px] px-[60px] py-20">
      <header className="mb-10">
        <PageEyebrow index="02" label="Learning curriculum" />
        <h1 className="mt-3 text-[36px] font-bold leading-[1.1] tracking-[-0.015em] text-foreground">
          Historical case challenges
        </h1>
        <p className="mt-2 max-w-2xl text-caption text-muted-foreground">
          Practice judgment on anonymized BDO deals. Compare your reasoning to
          what actually happened, the model answer, and senior-style thinking.
        </p>
      </header>

      <section className="mb-10 grid gap-6 rounded-lg border border-border bg-card p-6 md:grid-cols-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
            Career level
          </p>
          <p className="mt-1 text-[22px] font-bold text-foreground">
            {levelLabel}
          </p>
          <p className="mt-1 text-caption text-muted-foreground">
            Level {String(level).padStart(2, "0")} of 10
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Progress to next level
          </p>
          <p className="mt-1 text-[22px] font-bold tabular-nums text-foreground">
            {rolling?.average ?? "—"}
            <span className="text-[15px] font-normal text-muted-foreground">
              {" "}
              / {rolling?.target ?? 80}% avg
            </span>
          </p>
          <p className="mt-1 text-caption text-muted-foreground">
            Rolling window: last {rolling?.size ?? 5} challenges (
            {rolling?.attempts ?? 0} completed)
            {rolling?.readyToAdvance && (
              <span className="ml-1 font-bold text-primary">
                · Ready to advance
              </span>
            )}
          </p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-[14px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          Development ladder
        </h2>
        <ol className="flex flex-wrap gap-2">
          {CURRICULUM_CAREER_LEVELS.map((row) => (
            <li
              key={row.level}
              className={`rounded px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] ${
                row.level === level
                  ? "bg-primary text-primary-foreground"
                  : row.level < level
                    ? "bg-primary/10 text-foreground"
                    : "border border-border text-muted-foreground"
              }`}
            >
              Y{row.year} {row.label}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-6 text-[20px] font-bold text-foreground">
          Cases at your level
        </h2>
        {isLoading ? (
          <p className="text-caption text-muted-foreground">
            Loading cases…
          </p>
        ) : cases.length === 0 ? (
          <p className="text-caption text-muted-foreground">
            No cases for this level yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {cases.map((c) => (
              <Link
                key={c.id}
                to="/curriculum/$caseSlug"
                params={{ caseSlug: c.slug }}
                className="group flex items-center gap-4 rounded-lg border border-border bg-card px-6 py-5 transition-colors hover:bg-muted"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                    Case {String(c.sort_order ?? 0).padStart(2, "0")}
                  </p>
                  <h3 className="mt-0.5 text-[16px] font-bold leading-snug text-foreground group-hover:text-primary">
                    {c.title}
                  </h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {[c.industry, c.era].filter(Boolean).join(" · ") ||
                      (c.bestScore !== null
                        ? `Best score ${c.bestScore}/100`
                        : "Not started")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={c.status} />
                  <ChevronRight className="h-5 w-5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <PageCtaBanner
        icon={GraduationCap}
        title="Judgment beats repetition."
        subtitle="See how you are tracking across all challenges."
        linkTo="/practice"
        linkLabel="View practice dashboard"
      />
    </div>
  );
}
