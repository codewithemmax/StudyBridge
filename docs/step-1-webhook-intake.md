# Step 1: Twilio WhatsApp Webhook & Intake Setup

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

Configure the Twilio Sandbox for WhatsApp **When a message comes in** webhook URL as:

```text
https://<ngrok-host>/whatsapp/webhook
```

Use HTTP `POST`. Twilio does not require Meta-style GET challenge verification.

## Implemented intake flow

1. Twilio sends inbound WhatsApp events to `POST /whatsapp/webhook` as `application/x-www-form-urlencoded`.
2. The webhook immediately returns empty TwiML: `<Response></Response>`.
3. AI/image processing continues asynchronously after Twilio has received the 200 response.
4. Image messages are downloaded from `MediaUrl0` using Twilio Basic Auth.
5. The image is sent to OpenAI with the hardcoded WAEC/JAMB syllabus scaffold.
6. The service stores the tutoring session and sends only the first Socratic question via `client.messages.create`.
7. Follow-up text messages are gated by a code-level state machine before any model response is sent.

## Prototype risk notes

- The in-memory session store is intentionally temporary; Supabase logs exist, but active-session restore still needs a reload path.
- Ngrok free URLs rotate, so Twilio Sandbox webhook configuration will need updates after tunnel restarts.
- Twilio media URLs are fetched server-side with Account SID/Auth Token. Do not expose these credentials in client code.
