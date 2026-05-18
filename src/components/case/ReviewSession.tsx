import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";

type Props = {
  analystWork: unknown;
  company: string;
};

type TranscriptEntry = {
  role: string;
  text: string;
  at: number;
};

export function ReviewSession({ analystWork, company }: Props) {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasEnded, setHasEnded] = useState(false);
  const [started, setStarted] = useState(false);
  const transcriptRef = useRef<TranscriptEntry[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const conversation = useConversation({
    onConnect: () => setError(null),
    onDisconnect: () => setHasEnded(true),
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
    const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
    if (!agentId) {
      setError("Voice agent is not configured.");
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
        agentId,
        connectionType: "webrtc",
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
        {error && (
          <p className="text-caption text-destructive">{error}</p>
        )}
      </div>
    );
  }

  const statusLabel = hasEnded
    ? "Ended."
    : status === "connected"
      ? "In session."
      : "Connecting.";

  return (
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
              transcriptRef.current = [];
            }}
            variant="outline"
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
  );
}
