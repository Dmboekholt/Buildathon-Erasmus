import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";

import { getActiveJuniorId } from "@/hooks/use-workspace";
import {
  getCurriculumCase,
  submitCurriculumAttempt,
} from "@/lib/curriculum.functions";

export const Route = createFileRoute("/_app/curriculum/$caseId")({
  component: CurriculumCasePage,
});

type Question = { id: string; prompt: string; guidance?: string };

function CurriculumCasePage() {
  const { caseId } = Route.useParams();
  const juniorId = getActiveJuniorId();

  const fetchCase = useServerFn(getCurriculumCase);
  const submit = useServerFn(submitCurriculumAttempt);

  const { data: kase, isLoading } = useQuery({
    queryKey: ["curriculum-case", caseId],
    queryFn: () => fetchCase({ data: { id: caseId } }),
  });

  const questions: Question[] = useMemo(
    () => (kase?.questions as Question[] | null) ?? [],
    [kase],
  );

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    accuracy: number;
    perQuestion: { questionId: string; score: number }[];
    leveledUp: boolean;
    level: number;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: async () =>
      submit({
        data: {
          analystId: juniorId,
          caseId,
          answers: questions.map((q) => ({
            questionId: q.id,
            answer: answers[q.id] ?? "",
          })),
        },
      }),
    onSuccess: (r) => setResult(r),
  });

  if (isLoading || !kase) {
    return (
      <div className="mx-auto max-w-[1280px] py-20 px-[60px]">
        <p className="text-body text-muted-foreground">Loading case.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] py-20 px-[60px]">
      <Link
        to="/curriculum"
        className="mb-10 inline-flex items-center gap-2 text-[14px] font-bold uppercase tracking-[0.08em] text-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to curriculum
      </Link>

      <header className="mb-12">
        <div className="eyebrow mb-5">
          Level {kase.difficulty} · {kase.industry ?? "Case"}
        </div>
        <h1 className="text-[40px] font-bold leading-[1.05] tracking-[-0.015em] text-foreground">
          {kase.title}
        </h1>
        {kase.era && (
          <p className="mt-3 text-caption text-muted-foreground">{kase.era}</p>
        )}
      </header>

      <section className="mb-12 rounded-lg border border-border bg-card p-10">
        <div className="eyebrow mb-4">Case brief</div>
        <p className="whitespace-pre-line text-body text-foreground">
          {kase.case_text}
        </p>
      </section>

      <section className="mb-16">
        <div className="mb-8 border-t-2 border-foreground pt-6">
          <div className="eyebrow">02 Questions</div>
          <h2 className="mt-2 text-[24px] font-bold leading-tight text-foreground">
            Write your analysis
          </h2>
        </div>

        <div className="flex flex-col gap-8">
          {questions.map((q, idx) => {
            const score = result?.perQuestion.find(
              (p) => p.questionId === q.id,
            )?.score;
            return (
              <div key={q.id} className="rounded-lg border border-border bg-card p-8">
                <div className="mb-3 flex items-baseline justify-between gap-4">
                  <h3 className="text-[18px] font-bold text-foreground">
                    {String(idx + 1).padStart(2, "0")}. {q.prompt}
                  </h3>
                  {typeof score === "number" && (
                    <span className="text-[14px] font-bold uppercase tracking-[0.08em] text-primary">
                      {score}/100
                    </span>
                  )}
                </div>
                {q.guidance && (
                  <p className="mb-4 text-caption text-muted-foreground">
                    {q.guidance}
                  </p>
                )}
                <textarea
                  className="min-h-[140px] w-full resize-y rounded-md border border-border bg-background p-4 text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Write your answer."
                  value={answers[q.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  disabled={mutation.isPending}
                />
              </div>
            );
          })}
        </div>
      </section>

      {result && (
        <section className="mb-12 rounded-lg border border-border bg-card p-10">
          <div className="eyebrow mb-3">Result</div>
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="text-[44px] font-bold leading-none text-foreground">
                {result.accuracy}
              </div>
              <span className="text-caption text-muted-foreground">
                accuracy /100
              </span>
            </div>
            <div className="text-right">
              <div className="text-[20px] font-bold text-foreground">
                Level {result.level}
              </div>
              {result.leveledUp && (
                <span className="text-caption text-primary">
                  Leveled up. Strong work.
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {result &&
        (kase.historical_answer.trim() || kase.senior_reasoning.trim()) && (
          <section className="mb-12">
            <div className="mb-8 border-t-2 border-foreground pt-6">
              <div className="eyebrow">03 Learn from the archive</div>
              <h2 className="mt-2 text-[24px] font-bold leading-tight text-foreground">
                Compare with past work
              </h2>
            </div>
            <div className="flex flex-col gap-4">
              {kase.historical_answer.trim() && (
                <div className="rounded-lg border border-border bg-card p-8">
                  <div className="eyebrow mb-3">Past analyst answer</div>
                  <p className="whitespace-pre-line text-body text-foreground">
                    {kase.historical_answer}
                  </p>
                </div>
              )}
              {kase.senior_reasoning.trim() && (
                <div className="rounded-lg border border-border bg-card p-8">
                  <div className="eyebrow mb-3">Senior perspective</div>
                  <p className="whitespace-pre-line text-body text-foreground">
                    {kase.senior_reasoning}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || questions.length === 0}
          className="inline-flex items-center gap-3 rounded-md bg-primary px-8 py-4 text-[15px] font-bold uppercase tracking-[0.05em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {mutation.isPending ? "Scoring." : "Check my answers"}
        </button>
        {mutation.isError && (
          <span className="text-caption text-primary">
            Could not submit. Try again.
          </span>
        )}
      </div>
    </div>
  );
}
