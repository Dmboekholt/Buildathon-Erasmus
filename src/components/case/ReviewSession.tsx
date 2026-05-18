import { useCallback, useEffect, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getActiveJuniorId } from "@/hooks/use-workspace";
import {
  saveDebrief,
  scoreDebrief,
  type EvaluationResult,
} from "@/lib/review.functions";

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID as string | undefined;

type Props = {
  analystWork: unknown;
  company: string;
  caseId: string;
};

type TranscriptEntry = {
  role: string;
  text: string;
  at: number;
};

export function ReviewSession(props: Props) {
  return (
    <ConversationProvider>
      <ReviewSessionInner {...props} />
    </ConversationProvider>
  );
}

function ReviewSessionInner({ analystWork, company, caseId }: Props) {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasEnded, setHasEnded] = useState(false);
  const [started, setStarted] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const scoredRef = useRef(false);

  const saveDebriefFn = useServerFn(saveDebrief);
  const scoreDebriefFn = useServerFn(scoreDebrief);
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const runScoring = useCallback(async () => {
    if (scoredRef.current) return;
    scoredRef.current = true;
    const entries = transcriptRef.current;
    if (entries.length === 0) return;
    const transcript = entries
      .filter((e) => e.text.trim().length > 0)
      .map((e) => `${e.role}: ${e.text}`)
      .join("\n");
    if (!transcript) return;
    setScoring(true);
    setError(null);
    try {
      const { id } = await saveDebriefFn({
        data: { caseId, transcript, juniorId: getActiveJuniorId() },
      });
      const result = await scoreDebriefFn({ data: { debriefId: id } });
      setEvaluation(result);
      queryClient.invalidateQueries({ queryKey: ["improvements"] });
    } catch (e) {
      setError((e as Error).message || "Could not score session.");
      scoredRef.current = false;
    } finally {
      setScoring(false);
    }
  }, [caseId, queryClient, saveDebriefFn, scoreDebriefFn]);

  const conversation = useConversation({
    onConnect: () => setError(null),
    onDisconnect: () => {
      setHasEnded(true);
      void runScoring();
    },
    onError: () => setError("Connection failed. Please try again."),
    onMessage: (message: unknown) => {
      const m = message as { source?: string; message?: string; type?: string };
      transcriptRef.current.push({
        role: m.source ?? m.type ?? "unknown",
        text: m.message ?? "",
        at: Date.now(),
      });
    },
  });

  const start = useCallback(async () => {
    setError(null);
    setHasEnded(false);
    setEvaluation(null);
    scoredRef.current = false;
    if (!AGENT_ID) {
      setError("Agent is not configured.");
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access denied.");
      return;
    }
    try {
      setStarted(true);
      await conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "websocket",
        dynamicVariables: {
          analyst_work: JSON.stringify(analystWork),
          company,
        },
      });
    } catch {
      setError("Could not start session.");
      setStarted(false);
    }
  }, [analystWork, company, conversation]);

  const end = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch {
      // no op
    }
  }, [conversation]);

  if (!mounted) {
    return (
      <div>
        <Button
          disabled
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Start review session
        </Button>
      </div>
    );
  }

  const status = conversation.status;
  const isActive = started && status !== "disconnected";

  if (!isActive && !hasEnded) {
    return (
      <div className="space-y-2">
        <Button
          onClick={start}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Start review session
        </Button>
        {error && <p className="text-caption text-destructive">{error}</p>}
      </div>
    );
  }

  const statusLabel = hasEnded
    ? "Ended."
    : status === "connected"
      ? "In session."
      : "Connecting.";

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-card px-5 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-caption text-muted-foreground">
              {statusLabel}
            </span>
            {conversation.isSpeaking && !hasEnded && (
              <span className="inline-flex items-center gap-2 text-caption text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground" />
                Agent speaking.
              </span>
            )}
          </div>
          {hasEnded ? (
            <Button
              onClick={() => {
                setHasEnded(false);
                setStarted(false);
                setEvaluation(null);
                setError(null);
                scoredRef.current = false;
                transcriptRef.current = [];
              }}
              variant="outline"
              disabled={scoring}
            >
              Start new session
            </Button>
          ) : (
            <Button
              onClick={end}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              End session
            </Button>
          )}
        </div>
        {error && (
          <p className="mt-3 text-caption text-destructive">{error}</p>
        )}
      </div>

      {hasEnded && scoring && (
        <div className="rounded-md border border-border bg-card px-5 py-5">
          <div className="text-caption text-muted-foreground">
            Scoring your review.
          </div>
        </div>
      )}

      {evaluation && <EvaluationCard evaluation={evaluation} />}
    </div>
  );
}

function EvaluationCard({ evaluation }: { evaluation: EvaluationResult }) {
  return (
    <div className="rounded-md border border-border bg-card px-5 py-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-section text-foreground">Review feedback</h3>
        <div className="font-mono text-section text-foreground">
          {evaluation.overall_score}
          <span className="text-caption text-muted-foreground">/10</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 font-mono text-caption text-muted-foreground">
        <span>
          Decision: {evaluation.decision_making_score}/10
        </span>
        <span>Insights: {evaluation.insights_score}/10</span>
        <span>Judgement: {evaluation.judgement_score}/10</span>
      </div>
      {evaluation.summary && (
        <p className="mt-3 text-body text-foreground">{evaluation.summary}</p>
      )}

      {evaluation.strengths.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 text-caption text-muted-foreground">
            Strengths
          </div>
          <ul className="list-disc space-y-1 pl-5 text-body text-foreground">
            {evaluation.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {evaluation.gaps.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 text-caption text-muted-foreground">Gaps</div>
          <ul className="list-disc space-y-1 pl-5 text-body text-foreground">
            {evaluation.gaps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {(evaluation.applied.updated.length > 0 ||
        evaluation.applied.inserted > 0) && (
        <div className="mt-5">
          <div className="mb-2 text-caption text-muted-foreground">
            Improvements updated
          </div>
          <ul className="space-y-1 text-body text-foreground">
            {evaluation.applied.updated.map((u) => (
              <li key={u.id} className="text-caption">
                {u.action}: {u.from} to {u.to}
              </li>
            ))}
            {evaluation.applied.inserted > 0 && (
              <li className="text-caption">
                {evaluation.applied.inserted} new improvement
                {evaluation.applied.inserted === 1 ? "" : "s"} added.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
