-- Demo history for Step 4 digest generation.
-- Replace the phone number if you want the digest sent to your WhatsApp test recipient.

insert into public.students (whatsapp_phone, display_name)
values ('2348000000000', 'Demo Student')
on conflict (whatsapp_phone) do update set display_name = excluded.display_name, updated_at = now();

insert into public.tutoring_sessions (
  id, student_id, topic_id, problem_summary, status, difficulty, stage,
  nudge_count, student_attempt_count, direct_answer_request_count,
  answer_leak_block_count, outcome, created_at, updated_at
)
select
  demo.id,
  s.id,
  demo.topic_id,
  demo.problem_summary,
  demo.status,
  demo.difficulty,
  demo.stage,
  demo.nudge_count,
  demo.student_attempt_count,
  demo.direct_answer_request_count,
  demo.answer_leak_block_count,
  demo.outcome,
  demo.created_at,
  now()
from (
  values
    ('demo-session-quadratics-1', 'math.algebra.quadratics', 'Factorising x² - 5x + 6', 'completed', 'hard', 'final_answer_allowed', 4, 2, 1, 1, 'needs_review', now() - interval '6 days'),
    ('demo-session-trig-1', 'math.geometry.trigonometry', 'Finding sine in a right triangle', 'completed', 'medium', 'hint_allowed', 3, 1, 0, 0, 'in_progress', now() - interval '4 days'),
    ('demo-session-motion-1', 'physics.mechanics.motion', 'Final velocity from acceleration and time', 'completed', 'medium', 'hint_allowed', 2, 1, 0, 0, 'needs_review', now() - interval '2 days')
) as demo(id, topic_id, problem_summary, status, difficulty, stage, nudge_count, student_attempt_count, direct_answer_request_count, answer_leak_block_count, outcome, created_at)
join public.students s on s.whatsapp_phone = '2348000000000'
on conflict (id) do update set
  nudge_count = excluded.nudge_count,
  student_attempt_count = excluded.student_attempt_count,
  direct_answer_request_count = excluded.direct_answer_request_count,
  answer_leak_block_count = excluded.answer_leak_block_count,
  outcome = excluded.outcome,
  updated_at = now();

insert into public.topic_struggles (
  student_id, topic_id, session_id, difficulty, nudge_count, answer_leak_block_count, outcome, created_at
)
select s.id, demo.topic_id, demo.session_id, demo.difficulty, demo.nudge_count, demo.answer_leak_block_count, demo.outcome, demo.created_at
from public.students s
join (
  values
    ('math.algebra.quadratics', 'demo-session-quadratics-1', 'hard', 4, 1, 'needs_review', now() - interval '6 days'),
    ('math.geometry.trigonometry', 'demo-session-trig-1', 'medium', 3, 0, 'in_progress', now() - interval '4 days'),
    ('physics.mechanics.motion', 'demo-session-motion-1', 'medium', 2, 0, 'needs_review', now() - interval '2 days')
) as demo(topic_id, session_id, difficulty, nudge_count, answer_leak_block_count, outcome, created_at)
  on s.whatsapp_phone = '2348000000000';
