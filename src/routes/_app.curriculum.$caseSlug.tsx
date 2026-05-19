import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  Target,
} from "lucide-react";

import { useWorkspace } from "@/hooks/use-workspace";
import {
  getCurriculumCase,
  submitCurriculumAttempt,
} from "@/lib/curriculum.functions";
import { isUuid } from "@/lib/slug";

export const Route = createFileRoute("/_app/curriculum/$caseSlug")({
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

type ComparisonRefs = {
  historicalOutcome: string;
  modelAnswer: string;
  seniorReasoning: string;
};

type SubmitResult = {
  accuracy: number;
  passed: boolean;
  summary: string;
  strengths: string[];
  gaps: string[];
  skillIndicators: string[];
  alignmentHistorical: number;
  alignmentModel: number;
  alignmentSenior: number;
  perQuestion: PerQuestionResult[];
  leveledUp: boolean;
  level: number;
  levelLabel?: string;
  comparison: ComparisonRefs;
};

function AlignmentBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[12px]">
        <span className="font-bold text-foreground">{label}</span>
        <span className="tabular-nums text-primary">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
      {index} {label}
    </span>
  );
}

function MountainIllustration() {
  return (
    <svg
      viewBox="0 0 120 64"
      className="hidden h-16 w-[120px] shrink-0 opacity-40 sm:block"
      aria-hidden
    >
      <path
        d="M8 56 L40 20 L56 36 L72 12 L112 56 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-primary/50"
      />
      <circle cx="72" cy="12" r="3" fill="currentColor" className="text-primary" />
      <path
        d="M20 56 Q35 44 50 56 T80 56"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 3"
        className="text-primary/40"
      />
    </svg>
  );
}

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
  comparison,
}: {
  result: SubmitResult;
  questions: Question[];
  comparison: ComparisonRefs;
}) {
  const hasComparison =
    comparison.historicalOutcome.trim() ||
    comparison.modelAnswer.trim() ||
    comparison.seniorReasoning.trim();

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
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
          {result.levelLabel ?? `Level ${result.level}`}
          {result.leveledUp && (
            <span className="ml-2 font-bold text-primary">· Leveled up</span>
          )}
        </div>
      </div>

      <div className="grid gap-4 border-b border-border px-6 py-4 sm:grid-cols-3">
        <AlignmentBar
          label="Historical outcome"
          value={result.alignmentHistorical}
        />
        <AlignmentBar label="Model answer" value={result.alignmentModel} />
        <AlignmentBar
          label="Senior reasoning"
          value={result.alignmentSenior}
        />
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

      {hasComparison && (
        <details className="group border-t border-border" open>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-6 py-4 text-[13px] font-bold uppercase tracking-[0.08em] text-foreground hover:text-primary [&::-webkit-details-marker]:hidden">
            Three-way comparison
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="grid gap-4 border-t border-border bg-muted/40 px-6 py-4 md:grid-cols-3">
            {comparison.historicalOutcome.trim() && (
              <div>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
                  A. Historical outcome
                </div>
                <p className="text-caption leading-relaxed text-foreground">
                  {comparison.historicalOutcome}
                </p>
              </div>
            )}
            {comparison.modelAnswer.trim() && (
              <div>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
                  B. Model answer
                </div>
                <p className="text-caption leading-relaxed text-foreground">
                  {comparison.modelAnswer}
                </p>
              </div>
            )}
            {comparison.seniorReasoning.trim() && (
              <div>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
                  C. Senior-style reasoning
                </div>
                <p className="text-caption leading-relaxed text-foreground">
                  {comparison.seniorReasoning}
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
  const { caseSlug } = Route.useParams();
  const navigate = useNavigate();
  const { juniorId } = useWorkspace();

  const fetchCase = useServerFn(getCurriculumCase);
  const submit = useServerFn(submitCurriculumAttempt);

  const { data: kase, isLoading } = useQuery({
    queryKey: ["curriculum-case", caseSlug],
    queryFn: () => fetchCase({ data: { slug: caseSlug } }),
  });

  useEffect(() => {
    if (!kase?.slug || caseSlug === kase.slug) return;
    if (isUuid(caseSlug)) {
      void navigate({
        to: "/curriculum/$caseSlug",
        params: { caseSlug: kase.slug },
        replace: true,
      });
    }
  }, [caseSlug, kase?.slug, navigate]);

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
          caseId: kase!.id,
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
      <div className="mx-auto max-w-[900px] px-[60px] py-20">
        <p className="text-body text-muted-foreground">Loading assignment…</p>
      </div>
    );
  }

  const year = (kase.junior_year ?? kase.difficulty ?? 1) as number;
  const industryLabel = (kase.industry ?? "Case").toUpperCase();

  return (
    <div className="mx-auto max-w-[900px] px-[60px] py-12 pb-20">
      <Link
        to="/curriculum"
        className="mb-8 inline-flex items-center gap-2 text-[14px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to curriculum
      </Link>

      <header className="mb-10">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-primary">
            Year {year}
            {industryLabel ? ` · ${industryLabel}` : ""}
          </p>
          {kase.era && (
            <span className="text-[12px] text-muted-foreground">{kase.era}</span>
          )}
        </div>
        <h1 className="mt-3 text-[36px] font-bold leading-[1.1] tracking-[-0.02em] text-foreground">
          {kase.title}
        </h1>
      </header>

      {/* 01 Learn */}
      <section className="mb-12 overflow-hidden rounded-lg border border-border bg-muted/25">
        <div className="flex">
          <div className="w-1 shrink-0 bg-primary" aria-hidden />
          <div className="flex flex-1 gap-5 p-6 sm:p-8">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fce4ec]"
              aria-hidden
            >
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <SectionLabel index="01" label="Learn" />
              {kase.learning_objective?.trim() ? (
                <p className="mt-3 text-[16px] font-bold leading-snug text-foreground">
                  {kase.learning_objective}
                </p>
              ) : null}
              <p className="mt-4 whitespace-pre-line text-[14px] leading-relaxed text-muted-foreground">
                {kase.case_text}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 02 Judgment */}
      <section className="mb-10">
        <SectionLabel index="02" label="Your judgment" />
        <h2 className="mt-3 text-[22px] font-bold text-foreground">
          State your reasoning
        </h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          This is not a quiz. Provide your opinion, argumentation, risk view, and
          decision logic as you would to a senior.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {questions.map((q, idx) => {
            const pq = result?.perQuestion.find((p) => p.questionId === q.id);
            return (
              <div
                key={q.id}
                className="rounded-lg border border-border bg-card p-6"
              >
                <div className="flex gap-4">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-primary text-[12px] font-bold text-primary-foreground"
                    aria-hidden
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[15px] font-bold leading-snug text-foreground">
                        {q.prompt}
                      </h3>
                      {typeof pq?.score === "number" && (
                        <span className="shrink-0 text-[12px] font-bold tabular-nums text-primary">
                          {pq.score}/100
                        </span>
                      )}
                    </div>
                    {q.guidance && !result && (
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        {q.guidance}
                      </p>
                    )}
                    <textarea
                      className="mt-4 min-h-[120px] w-full resize-y rounded-md border border-border bg-background px-4 py-3 text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-70"
                      placeholder="Write your answer…"
                      value={answers[q.id] ?? ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                      disabled={mutation.isPending || !!result}
                      readOnly={!!result}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          {!result ? (
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || questions.length === 0}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-8 py-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
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
                <>
                  Submit for scoring
                  <ArrowRight className="h-4 w-4" />
                </>
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
                className="rounded-md border border-border bg-card px-6 py-3 text-[13px] font-bold uppercase tracking-[0.06em] text-foreground hover:bg-muted"
              >
                Edit answers
              </button>
              {result.passed && (
                <Link
                  to="/practice"
                  className="text-[13px] font-bold uppercase tracking-[0.06em] text-primary hover:underline"
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
        <section ref={feedbackRef} className="mb-10">
          <SectionLabel index="03" label="Your feedback" />
          <div className="mt-4">
            <FeedbackPanel
              result={result}
              questions={questions}
              comparison={
                result.comparison ?? {
                  historicalOutcome: kase.historical_answer,
                  modelAnswer:
                    kase.ai_answer?.trim() || kase.historical_answer,
                  seniorReasoning: kase.senior_reasoning,
                }
              }
            />
          </div>
        </section>
      )}

      {!result && (
        <section className="overflow-hidden rounded-lg border border-[#fce4ec] bg-[#fce4ec]/40">
          <div className="flex items-center justify-between gap-6 px-8 py-6">
            <div className="flex items-center gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fce4ec]"
                aria-hidden
              >
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[16px] font-bold text-foreground">
                  Take your time.
                </p>
                <p className="mt-0.5 text-[14px] text-muted-foreground">
                  Strong analysis comes from clear thinking.
                </p>
              </div>
            </div>
            <MountainIllustration />
          </div>
        </section>
      )}
    </div>
  );
}
