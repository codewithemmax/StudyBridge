# StudyBridge Prototype Setup

## 1. Install local dependencies

```bash
npm install
cp .env.example .env
```

## 2. Configure Supabase free tier

Create a Supabase project, open the SQL editor, and run:

```text
database/001_initial_schema.sql
database/002_seed_waec_jamb_topics.sql
database/003_seed_demo_week.sql
```

Copy these into `.env`:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Use the service role key only in this local server environment.

## 3. Configure OpenAI

```env
OPENAI_API_KEY=<your-key>
OPENAI_MODEL=gpt-5.6
```

If no OpenAI key is set, the app uses deterministic fallback prompts and practice questions for local demos.

## 4. Configure WhatsApp Cloud API test number

In the Meta developer console, copy:

```env
WHATSAPP_ACCESS_TOKEN=<temporary-or-system-user-token>
WHATSAPP_PHONE_NUMBER_ID=<test-phone-number-id>
VERIFY_TOKEN=<your-own-random-webhook-token>
```

## 5. Start the webhook server

```bash
npm run dev
```

## 6. Expose with Ngrok free tier

```bash
ngrok http 3000
```

Set the Meta webhook callback URL to:

```text
https://<ngrok-host>/whatsapp/webhook
```

Use the same `VERIFY_TOKEN` from `.env`.

## 7. Test intake

Send a homework image to the WhatsApp test number. The server should:

1. download the image from Meta;
2. send it to the vision layer;
3. map it to a WAEC/JAMB topic;
4. persist the student/session/message records;
5. reply with a Socratic first question.

## 8. Test the weekly digest

Run:

```bash
npm run digest:weekly
```

Or trigger the job endpoint:

```bash
curl -X POST "http://localhost:3000/jobs/weekly-digests?secret=$CRON_SECRET"
```

Set `CRON_SECRET` before exposing `/jobs/*` publicly.
