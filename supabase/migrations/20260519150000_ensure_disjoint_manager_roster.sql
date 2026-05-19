-- Idempotent: remove cross-manager project overlap if an older seed re-applied it
DELETE FROM public.project_members
WHERE project_id = 'b1111111-1111-1111-1111-111111111111'
  AND profile_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  AND role = 'manager';

INSERT INTO public.teams (id, name, manager_id) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'Valuation pod', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('e2222222-2222-2222-2222-222222222222', 'Strategy pod', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, manager_id = EXCLUDED.manager_id;

INSERT INTO public.team_members (team_id, profile_id) VALUES
  ('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
  ('e2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;
