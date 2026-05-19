import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getActiveJuniorId } from "@/hooks/use-workspace";
import { startPhoneReview, fetchPhoneTranscript } from "@/lib/phone.functions";
import {
  saveDebrief,
  scoreDebrief,
  type EvaluationResult,
} from "@/lib/review.functions";

type Props = { caseId: string };

type Phase = "idle" | "calling" | "waiting" | "scoring" | "done" | "error";

const POLL_INTERVAL_MS = 6000;
const MAX_POLLS = 90; // ~9 minutes

export function PhoneReview({ caseId }: Props) {
  const [phone, setPhone] = useState("+1");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startCallFn = useServerFn(startPhoneReview);
  const fetchTranscriptFn = useServerFn(fetchPhoneTranscript);
  const saveDebriefFn = useServerFn(saveDebrief);
  const scoreDebriefFn = useServerFn(scoreDebrief);
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const finish = useCallback(
    async (transcript: string) => {
      setPhase("scoring");
      try {
        const { id } = await saveDebriefFn({
          data: { caseId, transcript, juniorId: getActiveJuniorId() },
        });
        const result = await scoreDebriefFn({ data: { debriefId: id } });
        setEvaluation(result);
        queryClient.invalidateQueries({ queryKey: ["improvements"] });
        setPhase("done");
      } catch (e) {
        setError((e as Error).message || "Could not score the call.");
        setPhase("error");
      }
    },
    [caseId, queryClient, saveDebriefFn, scoreDebriefFn],
  );

  const poll = useCallback(
    async (conversationId: string, attempt: number) => {
      if (attempt > MAX_POLLS) {
        setError("The call is taking too long — please try again later.");
        setPhase("error");
        return;
      }
      try {
        const { status, transcript } = await fetchTranscriptFn({
          data: { conversationId },
        });
        if (status === "failed") {
          setError("The call failed or was not answered.");
          setPhase("error");
          return;
        }
        if (status === "done") {
          if (transcript.trim().length === 0) {
            setError("The call ended with no conversation recorded.");
            setPhase("error");
            return;
          }
          await finish(transcript);
          return;
        }
        timerRef.current = setTimeout(
          () => void poll(conversationId, attempt + 1),
          POLL_INTERVAL_MS,
        );
      } catch (e) {
        setError((e as Error).message || "Lost contact with the call.");
        setPhase("error");
      }
    },
    [fetchTranscriptFn, finish],
  );

  const startCall = useCallback(async () => {
    setError(null);
    setEvaluation(null);
    setPhase("calling");
    try {
      const { conversationId } = await startCallFn({
        data: { caseId, toNumber: phone.trim() },
      });
      setPhase("waiting");
      void poll(conversationId, 0);
    } catch (e) {
      setError((e as Error).message || "Could not place the call.");
      setPhase("error");
    }
  }, [caseId, phone, poll, startCallFn]);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("idle");
    setError(null);
    setEvaluation(null);
  }, []);

  const busy = phase === "calling" || phase === "waiting" || phase === "scoring";

  return (
    <div className="mt-4 rounded-lg border border-border bg-card px-5 py-5">
      <h3 className="text-section text-foreground">Review by phone call</h3>
      <p className="mt-1 text-caption text-muted-foreground">
        Mentor will call your phone and interview you about this case.
      </p>

      {(phase === "idle" || phase === "error") && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+19015633904"
            className="max-w-[220px]"
          />
          <Button
            onClick={startCall}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Call my phone
          </Button>
        </div>
      )}

      {busy && (
        <div className="mt-4 inline-flex items-center gap-2 text-caption text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground" />
          {phase === "calling" && "Placing the call…"}
          {phase === "waiting" &&
            "Calling your phone — pick up and talk to Mentor. This updates when the call ends."}
          {phase === "scoring" && "Call ended. Scoring your review…"}
        </div>
      )}

      {error && <p className="mt-3 text-caption text-destructive">{error}</p>}

      {phase === "done" && evaluation && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-caption text-muted-foreground">
              Phone review feedback
            </span>
            <span className="font-mono text-section text-foreground">
              {evaluation.overall_score}
              <span className="text-caption text-muted-foreground">/10</span>
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 font-mono text-caption text-muted-foreground">
            <span>Decision: {evaluation.decision_making_score}/10</span>
            <span>Insights: {evaluation.insights_score}/10</span>
            <span>Judgement: {evaluation.judgement_score}/10</span>
          </div>
          {evaluation.summary && (
            <p className="mt-3 text-body text-foreground">
              {evaluation.summary}
            </p>
          )}
          <Button onClick={reset} variant="outline" className="mt-4">
            New phone review
          </Button>
        </div>
      )}
    </div>
  );
}
