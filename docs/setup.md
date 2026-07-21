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

## 4. Configure Twilio Sandbox for WhatsApp

In the Twilio Console, open **Messaging > Try it out > Send a WhatsApp message** and join the sandbox from your phone. Copy these values into `.env`:

```env
TWILIO_ACCOUNT_SID=<account-sid>
TWILIO_AUTH_TOKEN=<auth-token>
TWILIO_PHONE_NUMBER=whatsapp:+14155238886
```

The sandbox sender is commonly `whatsapp:+14155238886`, but use the exact sender shown in your Twilio Sandbox page.

## 5. Start the webhook server

```bash
npm run dev
```

## 6. Expose with Ngrok free tier

```bash
ngrok http 3000
```

Set the Twilio Sandbox webhook URL to:

```text
https://<ngrok-host>/whatsapp/webhook
```

Twilio does not use a GET verification challenge; configure the Sandbox webhook as HTTP POST.

## 7. Test intake

Send a homework image to the WhatsApp test number. The server should:

1. download the image from Twilio `MediaUrl0`;
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
