import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { getActiveJuniorId } from "@/hooks/use-workspace";
import { startPhoneReview, fetchPhoneTranscript } from "@/lib/phone.functions";
import {
  saveDebrief,
  scoreDebrief,
  type EvaluationResult,
} from "@/lib/review.functions";

export type PhoneReviewPhase =
  | "idle"
  | "calling"
  | "waiting"
  | "scoring"
  | "done"
  | "error";

const POLL_INTERVAL_MS = 6000;
const MAX_POLLS = 90; // ~9 minutes

export function usePhoneReview(caseId: string) {
  const [phase, setPhase] = useState<PhoneReviewPhase>("idle");
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
        data: { caseId },
      });
      setPhase("waiting");
      void poll(conversationId, 0);
    } catch (e) {
      setError((e as Error).message || "Could not place the call.");
      setPhase("error");
    }
  }, [caseId, poll, startCallFn]);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("idle");
    setError(null);
    setEvaluation(null);
  }, []);

  const busy =
    phase === "calling" || phase === "waiting" || phase === "scoring";

  return {
    phase,
    error,
    evaluation,
    busy,
    startCall,
    reset,
  };
}
