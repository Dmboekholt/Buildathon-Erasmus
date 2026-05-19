-- Practice areas for curriculum dashboard (6 + 4 + 2 = 12 cases)

ALTER TABLE public.curriculum_cases
  ADD COLUMN IF NOT EXISTS practice_area text NOT NULL DEFAULT 'decision_making'
  CHECK (practice_area IN ('decision_making', 'insights', 'judgement'));

UPDATE public.curriculum_cases SET practice_area = 'decision_making' WHERE id IN (
  'c1111111-1111-1111-1111-111111111111',
  'c2222222-2222-2222-2222-222222222222',
  'c6666667-6667-6667-6667-666666666672',
  'c4444444-4444-4444-4444-444444444444',
  'c6666669-6669-6669-6669-666666666694',
  'c666666a-666a-666a-666a-6666666666a5'
);

UPDATE public.curriculum_cases SET practice_area = 'insights' WHERE id IN (
  'c6666666-6666-6666-6666-666666666661',
  'c3333333-3333-3333-3333-333333333333',
  'c6666668-6668-6668-6668-666666666683',
  'c666666b-666b-666b-666b-6666666666b6'
);

UPDATE public.curriculum_cases SET practice_area = 'judgement' WHERE id IN (
  'c5555555-5555-5555-5555-555555555555',
  'c666666c-666c-666c-666c-6666666666c7'
);
