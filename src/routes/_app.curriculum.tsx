import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProgress, LEVEL_NAMES } from "@/lib/curriculum.functions";

export const Route = createFileRoute("/_app/curriculum")({
  component: CurriculumLayout,
});

function CurriculumLayout() {
  const fetchProgress = useServerFn(getProgress);
  const { data } = useQuery({
    queryKey: ["curriculum-progress"],
    queryFn: () => fetchProgress(),
  });

  const level = data?.level ?? 1;
  const levelName = data?.levelName ?? LEVEL_NAMES[0];
  const rolling = data?.rollingAvg ?? 0;
  const rollingCount = data?.rollingCount ?? 0;

  return (
    <div className="mx-auto max-w-[1280px] px-[60px] py-16">
      <header className="mb-10">
        <div className="eyebrow mb-4">02. Learning curriculum</div>
        <h1 className="font-display text-[44px] leading-[48px] tracking-[-0.025em] text-foreground">
          Practice judgment on
          <br />
          <span className="text-muted-foreground">historical cases.</span>
        </h1>
        <p className="mt-4 max-w-xl text-body text-muted-foreground">
          Start a long-form historical case, answer a set of structured questions, then compare your reasoning to the expected answer, the AI answer, and a senior analyst's answer.
        </p>
      </header>

      <section className="mb-10 rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <div className="font-mono text-caption text-muted-foreground">
              Year {String(level).padStart(2, "0")} of 10
            </div>
            <div className="text-section font-medium text-foreground">{levelName}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-caption text-muted-foreground">
              rolling accuracy ({rollingCount}/5)
            </div>
            <div className="font-display text-[28px] leading-none text-foreground">
              {rolling}
              <span className="ml-1 font-mono text-caption text-muted-foreground">
                /100
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {LEVEL_NAMES.map((name, idx) => {
            const reached = idx + 1 <= level;
            const current = idx + 1 === level;
            return (
              <div
                key={name}
                title={`Year ${idx + 1}. ${name}`}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  current
                    ? "bg-foreground"
                    : reached
                      ? "bg-foreground/50"
                      : "bg-muted"
                }`}
              />
            );
          })}
        </div>
        <div className="mt-3 text-caption text-muted-foreground">
          Reach 80 average over your last 5 challenges at this level to advance.
        </div>
      </section>

      <Outlet />
    </div>
  );
}
