import twilio from 'twilio';
import { env } from '../config/env.js';

let cachedClient: ReturnType<typeof twilio> | undefined;

function getTwilioClient(): ReturnType<typeof twilio> | undefined {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) return undefined;
  cachedClient ??= twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  return cachedClient;
}

export async function downloadWhatsAppMedia(mediaUrl: string, mimeType = 'application/octet-stream'): Promise<{ mimeType: string; base64: string }> {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required to download Twilio media.');
  }

  const credentials = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
  const response = await fetch(mediaUrl, { headers: { Authorization: `Basic ${credentials}` } });
  if (!response.ok) throw new Error(`Twilio media download failed: ${response.status} ${await response.text()}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  return { mimeType, base64: bytes.toString('base64') };
}

export async function sendWhatsAppText(to: string, body: string): Promise<void> {
  const client = getTwilioClient();
  if (!client || !env.TWILIO_PHONE_NUMBER) {
    console.log(`[dev] Twilio WhatsApp reply to ${to}: ${body}`);
    return;
  }

  await client.messages.create({
    from: env.TWILIO_PHONE_NUMBER,
    to,
    body,
  });
}
