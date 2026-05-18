## Goal
Wire the existing "Start review session" button on `/cases/$caseId` to start a live ElevenLabs voice conversation, without altering the rest of the page or the design system.

## Steps

### 1. Dependency and env
- Install `@elevenlabs/react` via `bun add @elevenlabs/react`.
- Append `VITE_ELEVENLABS_AGENT_ID=""` to `.env` so the user can fill in the value.

### 2. New component: `src/components/case/ReviewSession.tsx`
Client-only voice session UI. Receives props `{ analystWork: unknown; company: string }`.

- Imports `useConversation` from `@elevenlabs/react` and `Button` from `@/components/ui/button`.
- SSR guard: render nothing until a `mounted` state flips true inside `useEffect`. This prevents the hook's microphone / WebRTC code paths from running on the server.
- Local state:
  - `transcript: Array<{ role: string; text: string; at: number }>` populated from the hook's `onMessage` callback (kept in state only, not rendered, per spec).
  - `error: string | null` for inline error display.
- `useConversation({ onMessage, onError, onDisconnect })`:
  - `onMessage` pushes message info into `transcript`.
  - `onError` sets `error` to "Connection failed. Please try again."
- `startSession` handler:
  1. Reads `agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID`. If missing, set error and stop.
  2. `await navigator.mediaDevices.getUserMedia({ audio: true })` inside try/catch; on failure set error to "Microphone access denied." and stop.
  3. `await conversation.startSession({ agentId, connectionType: "webrtc", dynamicVariables: { analyst_work: JSON.stringify(analystWork), company } })`. On throw set error to "Could not start session.".
- `endSession` handler calls `await conversation.endSession()`.
- Render logic:
  - If `conversation.status === "disconnected"` and no session has started yet: render the existing-style primary button "Start review session" (`bg-accent text-accent-foreground hover:bg-accent/90`), and the inline error text below it (`text-caption text-destructive`) when set.
  - Otherwise render a call panel using existing tokens (`rounded-md border border-border bg-card px-5 py-5`) containing:
    - Status line (`text-caption text-muted-foreground`): "Connecting." while `status !== "connected"`, "In session." while connected, "Ended." after disconnect (track via local `hasEnded` state set in `onDisconnect`).
    - Subtle speaking indicator: a small dot (`h-1.5 w-1.5 rounded-full bg-foreground`) with `animate-pulse` shown only when `conversation.isSpeaking`, paired with the muted-foreground label "Agent speaking.".
    - Primary "End session" button (same accent styling) wired to `endSession`. After end, swap to a secondary "Start new session" button that resets state.
    - Inline error text below when `error` is set.
- All copy uses periods, no em-dashes or en-dashes.

### 3. Edit `src/routes/_app.cases.$caseId.tsx`
- Replace the bottom block:
  ```tsx
  <div>
    <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
      Start review session
    </Button>
  </div>
  ```
  with `<ReviewSession analystWork={data.metadata} company={data.company} />`.
- Remove the now-unused `Button` import only if no other usage remains (it will be unused after this change).
- Do not touch any other section. `examiner_note`, `weak_spot`, and `coaching_priorities` were never rendered and remain unrendered; they ride along inside `analyst_work` via `JSON.stringify(data.metadata)`.

### 4. Verification
- Run the typecheck implicitly via the harness build.
- Confirm by reading the changed files that no other styles, fonts, or components were modified.

## Out of scope
- No server token endpoint. We use direct `agentId` connection per spec ("connecting by agentId"). If the ElevenLabs agent requires auth later, we will add a server function then.
- No persistence of transcript yet; it stays in component state for a later step.
- No new design tokens or component variants.

## Technical notes
- `import.meta.env.VITE_ELEVENLABS_AGENT_ID` is read at module/component scope only inside the click handler so a missing value doesn't crash render.
- The component is the SSR boundary. Even though TanStack Start SSRs route components, the `mounted` gate ensures `useConversation`'s browser APIs are only exercised client-side.
- The current `@elevenlabs/react` `useConversation().startSession` accepts `{ agentId, connectionType, dynamicVariables }`; this matches the knowledge file examples for public agents.
