import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ChevronDown } from "lucide-react";

import { useWorkspace } from "@/hooks/use-workspace";
import {
  getCurriculumCase,
  submitCurriculumAttempt,
} from "@/lib/curriculum.functions";

export const Route = createFileRoute("/_app/curriculum/$caseId")({
  component: CurriculumCasePage,
});

type Question = { id: string; prompt: string; guidance?: string };

type PerQuestionResult = {
  questionId: string;
  score: number;
  feedback?: string;
  demonstrated?: string[];
  missing?: string[];
};

type SubmitResult = {
  accuracy: number;
  passed: boolean;
  summary: string;
  strengths: string[];
  gaps: string[];
  skillIndicators: string[];
  perQuestion: PerQuestionResult[];
  leveledUp: boolean;
  level: number;
};

function TagList({ items, variant }: { items: string[]; variant: "ok" | "gap" }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={`rounded px-2 py-0.5 text-[12px] font-medium ${
            variant === "ok"
              ? "bg-primary/10 text-foreground"
              : "border border-border text-muted-foreground"
          }`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function FeedbackPanel({
  result,
  questions,
  historicalAnswer,
  seniorReasoning,
}: {
  result: SubmitResult;
  questions: Question[];
  historicalAnswer: string;
  seniorReasoning: string;
}) {
  const hasArchive = historicalAnswer.trim() || seniorReasoning.trim();

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div className="flex items-baseline gap-3">
          <span className="text-[32px] font-bold leading-none text-foreground">
            {result.accuracy}
          </span>
          <span className="text-caption text-muted-foreground">/ 100</span>
          <span
            className={`ml-2 text-[12px] font-bold uppercase tracking-[0.08em] ${
              result.passed ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {result.passed ? "Passed" : "Keep practicing"}
          </span>
        </div>
        <div className="text-right text-caption text-muted-foreground">
          Level {result.level}
          {result.leveledUp && (
            <span className="ml-2 font-bold text-primary">· Leveled up</span>
          )}
        </div>
      </div>

      {result.summary && (
        <p className="border-b border-border px-6 py-4 text-body text-foreground">
          {result.summary}
        </p>
      )}

      <div className="divide-y divide-border">
        {questions.map((q, idx) => {
          const pq = result.perQuestion.find((p) => p.questionId === q.id);
          if (!pq) return null;
          return (
            <div key={q.id} className="px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <p className="text-[14px] font-bold text-foreground">
                  {String(idx + 1).padStart(2, "0")}. {q.prompt}
                </p>
                <span className="shrink-0 text-[13px] font-bold tabular-nums text-primary">
                  {pq.score}/100
                </span>
              </div>
              {pq.feedback && (
                <p className="mt-2 text-caption leading-relaxed text-muted-foreground">
                  {pq.feedback}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {(result.strengths.length > 0 ||
        result.gaps.length > 0 ||
        result.skillIndicators.length > 0) && (
        <div className="grid gap-4 border-t border-border px-6 py-4 sm:grid-cols-2">
          {result.strengths.length > 0 && (
            <div>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
                Strengths
              </div>
              <TagList items={result.strengths} variant="ok" />
            </div>
          )}
          {result.gaps.length > 0 && (
            <div>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Gaps to close
              </div>
              <TagList items={result.gaps} variant="gap" />
            </div>
          )}
          {result.skillIndicators.length > 0 && (
            <div className="sm:col-span-2">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Skills touched
              </div>
              <TagList items={result.skillIndicators} variant="gap" />
            </div>
          )}
        </div>
      )}

      {hasArchive && (
        <details className="group border-t border-border">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-6 py-4 text-[13px] font-bold uppercase tracking-[0.08em] text-foreground hover:text-primary [&::-webkit-details-marker]:hidden">
            Compare with the archive
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-4 border-t border-border bg-muted/40 px-6 py-4">
            {historicalAnswer.trim() && (
              <div>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
                  Past analyst
                </div>
                <p className="text-caption leading-relaxed text-foreground">
                  {historicalAnswer}
                </p>
              </div>
            )}
            {seniorReasoning.trim() && (
              <div>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
                  Senior perspective
                </div>
                <p className="text-caption leading-relaxed text-foreground">
                  {seniorReasoning}
                </p>
              </div>
            )}
          </div>
        </details>
      )}
    </section>
  );
}

function CurriculumCasePage() {
  const { caseId } = Route.useParams();
  const { juniorId } = useWorkspace();

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
  const [result, setResult] = useState<SubmitResult | null>(null);
  const feedbackRef = useRef<HTMLElement>(null);

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
      }) as Promise<SubmitResult>,
    onSuccess: (r) => {
      setResult(r);
      requestAnimationFrame(() =>
        feedbackRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      );
    },
  });

  const errorMessage =
    mutation.error instanceof Error
      ? mutation.error.message.includes("KIMI_2_6_API_KEY")
        ? "AI scoring is not configured. Add KIMI_2_6_API_KEY to your environment."
        : mutation.error.message
      : null;

  if (isLoading || !kase) {
    return (
      <div className="mx-auto max-w-[1280px] py-20 px-[60px]">
        <p className="text-body text-muted-foreground">Loading case.</p>
      </div>
    );
  }

  const year = (kase.junior_year ?? kase.difficulty ?? 1) as number;

  return (
    <div className="mx-auto max-w-[900px] py-16 px-[60px]">
      <Link
        to="/curriculum"
        className="mb-8 inline-flex items-center gap-2 text-[14px] font-bold uppercase tracking-[0.08em] text-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to curriculum
      </Link>

      <header className="mb-10">
        <div className="eyebrow mb-3">
          Year {year} · {kase.industry ?? "Case"}
        </div>
        <h1 className="text-[32px] font-bold leading-tight tracking-[-0.015em] text-foreground">
          {kase.title}
        </h1>
        {kase.era && (
          <p className="mt-2 text-caption text-muted-foreground">{kase.era}</p>
        )}
      </header>

      <section className="mb-8 rounded-lg border border-border bg-card p-6">
        <div className="eyebrow mb-3">01 Learn</div>
        {kase.learning_objective?.trim() && (
          <p className="mb-4 text-body text-foreground">
            {kase.learning_objective}
          </p>
        )}
        <p className="whitespace-pre-line text-caption leading-relaxed text-muted-foreground">
          {kase.case_text}
        </p>
      </section>

      <section className="mb-8">
        <div className="mb-6 border-t border-foreground pt-5">
          <div className="eyebrow">02 Questions</div>
          <h2 className="mt-1 text-[20px] font-bold text-foreground">
            Write your analysis
          </h2>
        </div>

        <div className="flex flex-col gap-5">
          {questions.map((q, idx) => {
            const pq = result?.perQuestion.find((p) => p.questionId === q.id);
            return (
              <div
                key={q.id}
                className="rounded-lg border border-border bg-card p-5"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="text-[15px] font-bold leading-snug text-foreground">
                    {String(idx + 1).padStart(2, "0")}. {q.prompt}
                  </h3>
                  {typeof pq?.score === "number" && (
                    <span className="shrink-0 text-[12px] font-bold tabular-nums text-primary">
                      {pq.score}/100
                    </span>
                  )}
                </div>
                {q.guidance && !result && (
                  <p className="mb-3 text-caption text-muted-foreground">
                    {q.guidance}
                  </p>
                )}
                <textarea
                  className="min-h-[100px] w-full resize-y rounded-md border border-border bg-background p-3 text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-70"
                  placeholder="Write your answer."
                  value={answers[q.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  disabled={mutation.isPending || !!result}
                  readOnly={!!result}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {!result ? (
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || questions.length === 0}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-[14px] font-bold uppercase tracking-[0.05em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <span
                    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                    aria-hidden
                  />
                  Checking…
                </>
              ) : (
                "Check my answers"
              )}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  mutation.reset();
                }}
                className="rounded-md border border-border bg-card px-6 py-3 text-[14px] font-bold uppercase tracking-[0.05em] text-foreground hover:bg-muted"
              >
                Edit answers
              </button>
              {result.passed && (
                <Link
                  to="/practice"
                  className="text-[13px] font-bold uppercase tracking-[0.08em] text-primary hover:underline"
                >
                  Practice dashboard →
                </Link>
              )}
            </>
          )}
          {errorMessage && (
            <span className="text-caption text-primary">{errorMessage}</span>
          )}
        </div>
      </section>

      {result && (
        <section ref={feedbackRef} className="mb-8">
          <div className="eyebrow mb-3">03 Your feedback</div>
          <FeedbackPanel
            result={result}
            questions={questions}
            historicalAnswer={kase.historical_answer}
            seniorReasoning={kase.senior_reasoning}
          />
        </section>
      )}
    </div>
  );
}
