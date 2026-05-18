import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import {
  listCases,
  getCase,
  submitAttempt,
  seedCurriculumIfEmpty,
  forceReseedCurriculum,
} from "@/lib/curriculum.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/curriculum/")({
  component: ChallengePage,
});

type SubmitResult = Awaited<ReturnType<typeof submitAttempt>>;

function ChallengePage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listCases);
  const seed = useServerFn(seedCurriculumIfEmpty);

  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const { data: cases, isLoading, refetch } = useQuery({
    queryKey: ["curriculum-cases"],
    queryFn: async () => {
      const first = await fetchList();
      if (!first || first.length === 0) {
        await seed();
        return fetchList();
      }
      return first;
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-body text-muted-foreground">
        Preparing your case library. The first load can take a moment while cases are generated.
      </div>
    );
  }

  if (result && activeCaseId) {
    return (
      <ReviewPanel
        result={result}
        onAnother={() => {
          setResult(null);
          setActiveCaseId(null);
          qc.invalidateQueries({ queryKey: ["curriculum-progress"] });
        }}
        onRetry={() => {
          setResult(null);
        }}
      />
    );
  }

  if (activeCaseId) {
    return (
      <InProgressCase
        caseId={activeCaseId}
        onExit={() => setActiveCaseId(null)}
        onSubmitted={(r) => setResult(r)}
      />
    );
  }

  return (
    <BrowsePanel
      cases={cases ?? []}
      onStart={(id) => {
        setResult(null);
        setActiveCaseId(id);
      }}
      onReseed={async () => {
        await seed();
        await refetch();
      }}
    />
  );
}

function BrowsePanel({
  cases,
  onStart,
  onReseed,
}: {
  cases: { id: string; title: string; era: string | null; industry: string | null; difficulty: number }[];
  onStart: (id: string) => void;
  onReseed: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-section font-medium text-foreground">Available cases</h2>
        {cases.length === 0 && (
          <Button variant="outline" className="rounded-pill" onClick={onReseed}>
            Generate case library
          </Button>
        )}
      </div>
      {cases.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center text-body text-muted-foreground">
          No cases yet. Generate the case library to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cases.map((c) => (
            <article
              key={c.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6"
            >
              <div className="font-mono text-caption text-muted-foreground">
                {c.era ?? "n.d."} . {c.industry ?? "Finance"} . difficulty {c.difficulty}/10
              </div>
              <h3 className="text-section font-medium text-foreground">{c.title}</h3>
              <div className="mt-auto flex items-center justify-between pt-2">
                <Badge variant="outline" className="rounded-pill font-mono text-caption">
                  Long-form case
                </Badge>
                <Button className="rounded-pill" onClick={() => onStart(c.id)}>
                  Start case
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function InProgressCase({
  caseId,
  onExit,
  onSubmitted,
}: {
  caseId: string;
  onExit: () => void;
  onSubmitted: (r: SubmitResult) => void;
}) {
  const fetchCase = useServerFn(getCase);
  const submit = useServerFn(submitAttempt);
  const qc = useQueryClient();

  const { data: c, isLoading } = useQuery({
    queryKey: ["curriculum-case", caseId],
    queryFn: () => fetchCase({ data: { caseId } }),
  });

  const [answers, setAnswers] = useState<Record<string, string>>({});

  const allAnswered = useMemo(() => {
    if (!c) return false;
    return c.questions.every((q) => (answers[q.id] ?? "").trim().length > 0);
  }, [c, answers]);

  const mut = useMutation({
    mutationFn: () => submit({ data: { caseId, answers } }),
    onSuccess: (r) => {
      onSubmitted(r);
      qc.invalidateQueries({ queryKey: ["curriculum-progress"] });
      qc.invalidateQueries({ queryKey: ["curriculum-attempts"] });
    },
  });

  if (isLoading || !c) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-body text-muted-foreground">
        Loading case.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="text-caption text-muted-foreground hover:text-foreground"
        >
          ← Back to case list
        </button>
        <Badge variant="outline" className="rounded-pill font-mono text-caption">
          {c.questions.length} questions
        </Badge>
      </div>

      <article className="rounded-lg border border-border bg-card p-7">
        <div className="font-mono text-caption text-muted-foreground">
          {c.era ?? "n.d."} . {c.industry ?? "Finance"} . difficulty {c.difficulty}/10
        </div>
        <h2 className="mt-1 text-section font-medium text-foreground">{c.title}</h2>
        <div className="mt-5 whitespace-pre-wrap text-body leading-relaxed text-foreground/90">
          {c.case_text}
        </div>
      </article>

      <section className="space-y-5">
        <h3 className="text-section font-medium text-foreground">Questions</h3>
        {c.questions.map((q, idx) => (
          <div key={q.id} className="rounded-lg border border-border bg-card p-6">
            <div className="mb-3 flex items-baseline gap-3">
              <span className="font-mono text-caption text-muted-foreground">
                Q{idx + 1}
              </span>
              <p className="text-body font-medium text-foreground">{q.prompt}</p>
            </div>
            <textarea
              value={answers[q.id] ?? ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
              }
              disabled={mut.isPending}
              rows={5}
              className="w-full resize-y rounded-md border border-input bg-background p-3 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
              placeholder="Write your answer. Show your reasoning and any numbers you use."
            />
          </div>
        ))}
      </section>

      <div className="sticky bottom-4 flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-lg">
        <div className="text-caption text-muted-foreground">
          {mut.isPending
            ? "Scoring your answers."
            : allAnswered
              ? "All questions answered."
              : `Answer all ${c.questions.length} questions to check.`}
        </div>
        <Button
          disabled={!allAnswered || mut.isPending}
          onClick={() => mut.mutate()}
          className="rounded-pill"
        >
          {mut.isPending ? "Checking." : "Check my answers"}
        </Button>
      </div>

      {mut.isError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-caption text-destructive">
          {(mut.error as Error).message}
        </div>
      )}
    </div>
  );
}

function ReviewPanel({
  result,
  onAnother,
  onRetry,
}: {
  result: SubmitResult;
  onAnother: () => void;
  onRetry: () => void;
}) {
  const s = result.scored;
  const bars = [
    { label: "Accuracy", value: s.accuracy_score },
    { label: "vs Expected", value: s.alignment_historical },
    { label: "vs AI answer", value: s.alignment_ai },
    { label: "vs Senior reasoning", value: s.alignment_senior },
  ];
  const skills = [
    { label: "Insight", value: s.skill_indicators.insight },
    { label: "Risk awareness", value: s.skill_indicators.risk_awareness },
    { label: "Pattern recognition", value: s.skill_indicators.pattern_recognition },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-7">
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="text-section font-medium text-foreground">
            Review: {result.reveal.title}
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-pill" onClick={onRetry}>
              Retry this case
            </Button>
            <Button className="rounded-pill" onClick={onAnother}>
              Try another case
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {bars.map((b) => (
            <div key={b.label}>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-body text-foreground">{b.label}</span>
                <span className="font-mono text-caption text-muted-foreground">
                  {b.value}/100
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground transition-[width] duration-500"
                  style={{ width: `${b.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-5">
          {skills.map((sk) => (
            <div key={sk.label}>
              <div className="font-mono text-caption text-muted-foreground">
                {sk.label}
              </div>
              <div className="font-display text-[24px] leading-none text-foreground">
                {sk.value}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 border-t border-border pt-5 text-body text-foreground/90">
          {s.feedback}
        </p>
      </section>

      <div className="space-y-5">
        {result.reveal.questions.map((q, idx) => (
          <article key={q.id} className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-caption text-muted-foreground">
                  Q{idx + 1}
                </span>
                <p className="text-body font-medium text-foreground">{q.prompt}</p>
              </div>
              <Badge variant="outline" className="rounded-pill font-mono text-caption">
                {q.score}/100
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <AnswerBlock label="Your answer" body={q.analyst_answer} highlight />
              <AnswerBlock label="Expected" body={q.expected_answer} />
              <AnswerBlock label="Senior" body={q.senior_answer} />
              <AnswerBlock label="AI" body={q.ai_answer} />
            </div>
            {q.feedback && (
              <p className="mt-4 border-t border-border pt-4 text-caption text-muted-foreground">
                {q.feedback}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function AnswerBlock({
  label,
  body,
  highlight,
}: {
  label: string;
  body: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-md border p-4 ${
        highlight ? "border-foreground/40 bg-background" : "border-border bg-background/60"
      }`}
    >
      <div className="font-mono text-caption text-muted-foreground">{label}</div>
      <p className="whitespace-pre-wrap text-caption leading-relaxed text-foreground/90">
        {body}
      </p>
    </div>
  );
}
