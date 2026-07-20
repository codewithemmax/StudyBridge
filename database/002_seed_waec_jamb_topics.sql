insert into public.syllabus_topics (id, subject, unit, topic, exam_scaffold, sort_order) values
  ('math.algebra.quadratics', 'Mathematics', 'Algebra', 'Quadratic equations', 'WAEC/JAMB', 10),
  ('math.algebra.simultaneous', 'Mathematics', 'Algebra', 'Simultaneous equations', 'WAEC/JAMB', 20),
  ('math.geometry.trigonometry', 'Mathematics', 'Geometry', 'Trigonometry', 'WAEC/JAMB', 30),
  ('physics.mechanics.motion', 'Physics', 'Mechanics', 'Motion', 'WAEC/JAMB', 40),
  ('chemistry.stoichiometry.mole', 'Chemistry', 'Stoichiometry', 'Mole concept', 'WAEC/JAMB', 50)
on conflict (id) do update set
  subject = excluded.subject,
  unit = excluded.unit,
  topic = excluded.topic,
  exam_scaffold = excluded.exam_scaffold,
  sort_order = excluded.sort_order;
