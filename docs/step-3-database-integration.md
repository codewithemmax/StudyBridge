# Step 3: Database Integration

## Supabase setup

Run these files in the Supabase SQL editor in order:

1. `database/001_initial_schema.sql`
2. `database/002_seed_waec_jamb_topics.sql`

Then set the local environment variables:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-for-local-server-only>
```

Use `SUPABASE_SERVICE_ROLE_KEY` for the local webhook server if Row Level Security is enabled. Do not put the service role key in browser/client code.

## Tables

- `students`: one row per WhatsApp phone number.
- `syllabus_topics`: hardcoded WAEC/JAMB topic scaffold used for source-grounded tutoring.
- `tutoring_sessions`: one active problem-solving session per homework intake.
- `tutoring_messages`: student/assistant turn history.
- `topic_struggles`: append-only snapshots for weak-topic aggregation in Step 4.

## Logged outcomes

The webhook now logs:

- student phone number
- session topic and syllabus anchor
- problem summary
- current Socratic stage
- number of nudges
- student attempts
- direct answer requests
- blocked answer leaks
- derived difficulty
- derived session outcome

## Prototype risk notes

- Database writes are non-blocking from a product perspective: failures are logged but WhatsApp replies still continue. This keeps the demo alive, but it can hide data-quality problems if Supabase credentials are wrong.
- The service currently inserts recent messages after every turn. Step 4 or a cleanup pass should add idempotency keys if webhook retries create duplicates.
- Difficulty and outcome are rule-derived placeholders. They are useful for the demo, but they are not yet a robust learning analytics model.
