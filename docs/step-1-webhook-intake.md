# Step 1: Webhook & Intake Setup

## Local run

```bash
npm install
cp .env.example .env
npm run dev
```

Expose the local server with the free Ngrok tier:

```bash
ngrok http 3000
```

Configure the Meta WhatsApp Cloud API webhook callback URL as:

```text
https://<ngrok-host>/whatsapp/webhook
```

Use the same `VERIFY_TOKEN` value from `.env` during webhook verification.

## Implemented intake flow

1. Meta sends webhook verification to `GET /whatsapp/webhook`.
2. Meta sends message events to `POST /whatsapp/webhook`.
3. Image messages are downloaded from the WhatsApp media endpoint.
4. The image is sent to OpenAI with the hardcoded WAEC/JAMB syllabus scaffold.
5. The service stores an in-memory tutoring session and sends only the first Socratic question.
6. Follow-up text messages are gated by a code-level state machine before any model response is sent.

## Prototype risk notes

- The in-memory session store is intentionally temporary; Step 3 must move this to Supabase or sessions will be lost on restart.
- Ngrok free URLs rotate, so Meta webhook configuration will need updates after tunnel restarts.
- Image payloads should be resized before production use to reduce latency and model spend.
