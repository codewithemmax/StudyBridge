# Step 4: Weekly Digest Generation

## Run locally

```bash
npm run digest:weekly
```

Or trigger the HTTP job while the server is running:

```bash
curl -X POST "http://localhost:3000/jobs/weekly-digests?secret=$CRON_SECRET"
```

If `CRON_SECRET` is unset, the local endpoint is open. Set it before exposing the server through Ngrok.

## Demo data

Run this SQL after the Step 3 schema and syllabus seed:

1. `database/001_initial_schema.sql`
2. `database/002_seed_waec_jamb_topics.sql`
3. `database/003_seed_demo_week.sql`

The demo seed creates one student and one week of topic-struggle history for quadratics, trigonometry, and motion.

## Digest behavior

The digest job:

1. reads students from Supabase;
2. pulls each student's last 7 days of `topic_struggles`;
3. ranks topics by difficulty, outcome, nudges, and blocked answer leaks;
4. generates up to 3 practice questions through OpenAI, with deterministic free fallback questions when no API key is configured;
5. formats a WhatsApp-friendly digest;
6. sends it via the WhatsApp client.

## Prototype risk notes

- This is a manually triggered job, not a hosted scheduler. On the 0 Naira plan, use your laptop, a free cron ping, or a manual demo trigger.
- The digest uses WhatsApp text for reliability. True WhatsApp list messages require additional interactive-message payload handling and stricter template/window constraints.
- If Supabase is disabled, the job returns a local demo digest instead of failing. Good for demos, risky for production because missing credentials can go unnoticed.
