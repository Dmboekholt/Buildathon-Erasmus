-- Bi-weekly work check-ins (voice via Twilio + ElevenLabs)

ALTER TABLE public.debriefs
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'case_review';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS check_in_interval_days int NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS last_check_in_at timestamptz;

CREATE TABLE IF NOT EXISTS public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  junior_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  primary_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'calling', 'completed', 'failed', 'skipped')),
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  called_at timestamptz,
  completed_at timestamptz,
  elevenlabs_conversation_id text,
  twilio_call_sid text,
  debrief_id uuid REFERENCES public.debriefs(id) ON DELETE SET NULL,
  failure_reason text,
  work_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_check_ins_junior_scheduled
  ON public.check_ins (junior_id, scheduled_for DESC);

CREATE INDEX IF NOT EXISTS idx_check_ins_status
  ON public.check_ins (status) WHERE status IN ('scheduled', 'calling');

CREATE TRIGGER check_ins_touch_updated_at
  BEFORE UPDATE ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo_all_check_ins" ON public.check_ins
  FOR ALL USING (true) WITH CHECK (true);
