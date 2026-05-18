import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  submitSeniorCase,
  listCases,
  listAttempts,
} from "@/lib/curriculum.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_app/curriculum/upload")({
  component: SeniorUploadPage,
});

function SeniorUploadPage() {
  const qc = useQueryClient();
  const submit = useServerFn(submitSeniorCase);
  const fetchCases = useServerFn(listCases);
  const fetchAttempts = useServerFn(listAttempts);

  const [title, setTitle] = useState("");
  const [raw, setRaw] = useState("");

  const { data: cases } = useQuery({
    queryKey: ["curriculum-cases"],
    queryFn: () => fetchCases(),
  });
  const { data: attempts } = useQuery({
    queryKey: ["curriculum-attempts"],
    queryFn: () => fetchAttempts(),
  });

  const mut = useMutation({
    mutationFn: () => submit({ data: { title: title.trim(), rawText: raw.trim() } }),
    onSuccess: () => {
      setTitle("");
      setRaw("");
      qc.invalidateQueries({ queryKey: ["curriculum-cases"] });
      qc.invalidateQueries({ queryKey: ["curriculum-case"] });
    },
  });

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-border bg-card p-7">
        <h3 className="text-section font-medium text-foreground">
          Convert a case into a learning challenge
        </h3>
        <p className="mt-1 text-caption text-muted-foreground">
          Paste an old deal memo, post mortem, or financial situation. AI structures it into a challenge with historical answer, AI answer, and senior reasoning prefilled.
        </p>
        <div className="mt-5 space-y-3">
          <Input
            placeholder="Case title (e.g. Acme buyout 2014)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={mut.isPending}
          />
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            disabled={mut.isPending}
            rows={10}
            className="w-full resize-y rounded-md border border-input bg-background p-3 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
            placeholder="Paste the raw material here. Include facts, numbers, context, and what eventually happened so the AI can build accurate reveal answers."
          />
          <div className="flex items-center justify-between">
            <div className="text-caption text-muted-foreground">
              {mut.isPending ? "Generating challenge." : `${raw.length} characters`}
            </div>
            <Button
              disabled={mut.isPending || !title.trim() || raw.trim().length < 20}
              onClick={() => mut.mutate()}
              className="rounded-pill"
            >
              {mut.isPending ? "Generating." : "Generate challenge"}
            </Button>
          </div>
          {mut.isError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-caption text-destructive">
              {(mut.error as Error).message}
            </div>
          )}
          {mut.isSuccess && mut.data && (
            <div className="rounded-md border border-border bg-background p-3 text-caption text-foreground">
              Added: {mut.data.title} (difficulty {mut.data.difficulty}/10)
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="text-section font-medium text-foreground">Case library</h3>
          <span className="font-mono text-caption text-muted-foreground">
            {(cases ?? []).length} total
          </span>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-body">
            <thead>
              <tr className="border-b border-border text-left font-mono text-caption text-muted-foreground">
                <th className="px-4 py-2.5">Title</th>
                <th className="px-4 py-2.5">Era</th>
                <th className="px-4 py-2.5">Industry</th>
                <th className="px-4 py-2.5">Difficulty</th>
                <th className="px-4 py-2.5">Source</th>
              </tr>
            </thead>
            <tbody>
              {(cases ?? []).map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 text-foreground">{c.title}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.era}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.industry}</td>
                  <td className="px-4 py-2.5 font-mono text-caption">{c.difficulty}/10</td>
                  <td className="px-4 py-2.5 font-mono text-caption text-muted-foreground">
                    {c.source}
                  </td>
                </tr>
              ))}
              {(cases ?? []).length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-muted-foreground" colSpan={5}>
                    No cases yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="text-section font-medium text-foreground">
            Recent analyst attempts
          </h3>
          <span className="font-mono text-caption text-muted-foreground">
            {(attempts ?? []).length} shown
          </span>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-body">
            <thead>
              <tr className="border-b border-border text-left font-mono text-caption text-muted-foreground">
                <th className="px-4 py-2.5">Case</th>
                <th className="px-4 py-2.5">Year</th>
                <th className="px-4 py-2.5">Accuracy</th>
                <th className="px-4 py-2.5">Hist.</th>
                <th className="px-4 py-2.5">AI</th>
                <th className="px-4 py-2.5">Senior</th>
                <th className="px-4 py-2.5">When</th>
              </tr>
            </thead>
            <tbody>
              {(attempts ?? []).map((a) => {
                const c = a as unknown as { curriculum_cases?: { title?: string } };
                const title = c.curriculum_cases?.title ?? "Case";
                return (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 text-foreground">{title}</td>
                    <td className="px-4 py-2.5 font-mono text-caption">
                      {a.analyst_level}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-caption">
                      {a.accuracy_score}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-caption">
                      {a.alignment_historical}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-caption">
                      {a.alignment_ai}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-caption">
                      {a.alignment_senior}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
              {(attempts ?? []).length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-muted-foreground" colSpan={7}>
                    No attempts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
