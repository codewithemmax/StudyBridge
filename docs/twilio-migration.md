# Twilio Sandbox Migration Notes

## Dependency commands

No Meta-specific npm SDK was installed in this prototype. The previous Meta client used built-in `fetch`, so there is nothing Meta-specific to uninstall.

Run:

```bash
npm install twilio
```

If you had added axios locally for Meta calls, remove it only if nothing else uses it:

```bash
npm uninstall axios
```

## Environment change

Remove:

```env
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
VERIFY_TOKEN=
```

Use:

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=whatsapp:+14155238886
```

## Webhook change

Twilio sends `application/x-www-form-urlencoded` fields such as `From`, `Body`, `NumMedia`, `MediaUrl0`, and `MediaContentType0`. The webhook immediately returns empty TwiML so Twilio is not blocked by OpenAI latency, then sends the final reply through the Twilio REST API.
