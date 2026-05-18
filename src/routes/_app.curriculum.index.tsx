import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import {
  pickCaseForLevel,
  submitAttempt,
  seedCurriculumIfEmpty,
} from "@/lib/curriculum.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/curriculum/")({
  component: ChallengePage,
});

type Scored = Awaited<ReturnType<typeof submitAttempt>>;

function ChallengePage() {
  const qc = useQueryClient();
  const fetchCase = useServerFn(pickCaseForLevel);
  const submit = useServerFn(submitAttempt);
  const seed = useServerFn(seedCurriculumIfEmpty);

  const [insight, setInsight] = useState("");
  const [result, setResult] = useState<Scored | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const { data: challenge, isLoading } = useQuery({
    queryKey: ["curriculum-case", reloadKey],
    queryFn: async () => {
      const first = await fetchCase();
      if (!first) {
        await seed();
        return fetchCase();
      }
      return first;
    },
  });

  useEffect(() => {
    setInsight("");
    setResult(null);
  }, [reloadKey]);

  const mut = useMutation({
    mutationFn: (text: string) =>
      submit({ data: { caseId: challenge!.id, writtenInsight: text } }),
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ["curriculum-progress"] });
      qc.invalidateQueries({ queryKey: ["curriculum-attempts"] });
    },
  });

  if (isLoading || !challenge) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-body text-muted-foreground">
        Preparing your case library. This can take a moment on first load.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <article className="rounded-lg border border-border bg-card p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="font-mono text-caption text-muted-foreground">
              {challenge.era} . {challenge.industry} . difficulty {challenge.difficulty}/10
            </div>
            <h2 className="mt-1 text-section font-medium text-foreground">
              {challenge.title}
            </h2>
          </div>
          <Badge variant="outline" className="rounded-pill font-mono text-caption">
            {challenge.expected_insight_count} key insights expected
          </Badge>
        </div>
        <p className="whitespace-pre-wrap text-body text-foreground/90">
          {challenge.case_text}
        </p>
      </article>

      <section className="rounded-lg border border-border bg-card p-7">
        <label htmlFor="insight" className="text-body font-medium text-foreground">
          Your insight
        </label>
        <p className="mb-3 text-caption text-muted-foreground">
          What do you see. What is the risk. What would you do.
        </p>
        <textarea
          id="insight"
          value={insight}
          onChange={(e) => setInsight(e.target.value)}
          disabled={mut.isPending || !!result}
          rows={8}
          className="w-full resize-y rounded-md border border-input bg-background p-3 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
          placeholder="Write a short structured answer. Aim for the signal a senior would catch."
        />
        <div className="mt-4 flex items-center justify-between">
          <div className="text-caption text-muted-foreground">
            {mut.isPending ? "Scoring your answer." : result ? "Scored." : `${insight.length} characters`}
          </div>
          {!result ? (
            <Button
              disabled={!insight.trim() || mut.isPending}
              onClick={() => mut.mutate(insight.trim())}
              className="rounded-pill"
            >
              {mut.isPending ? "Scoring." : "Check my answer"}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="rounded-pill"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              Next case
            </Button>
          )}
        </div>
        {mut.isError && (
          <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-caption text-destructive">
            {(mut.error as Error).message}
          </div>
        )}
      </section>

      {result && <ResultPanel result={result} />}
    </div>
  );
}

function ResultPanel({ result }: { result: Scored }) {
  const s = result.scored;
  const bars = [
    { label: "Accuracy", value: s.accuracy_score },
    { label: "vs Historical", value: s.alignment_historical },
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
        <h3 className="mb-4 text-section font-medium text-foreground">Scoring</h3>
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

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <RevealCard label="Historical answer" body={result.reveal.historical_answer} />
        <RevealCard label="AI answer" body={result.reveal.ai_answer} />
        <RevealCard label="Senior reasoning" body={result.reveal.senior_reasoning} />
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="mb-2 font-mono text-caption text-muted-foreground">
          Key insights to look for
        </div>
        <ul className="list-disc space-y-1 pl-5 text-body text-foreground/90">
          {result.reveal.expected_insights.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function RevealCard({ label, body }: { label: string; body: string }) {
  return (
    <article className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5">
      <div className="font-mono text-caption text-muted-foreground">{label}</div>
      <p className="text-body text-foreground/90">{body}</p>
    </article>
  );
}
