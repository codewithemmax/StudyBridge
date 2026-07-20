import { env } from '../config/env.js';

const graphBase = 'https://graph.facebook.com/v20.0';

export async function downloadWhatsAppMedia(mediaId: string): Promise<{ mimeType: string; base64: string }> {
  if (!env.WHATSAPP_ACCESS_TOKEN) throw new Error('WHATSAPP_ACCESS_TOKEN is required to download media.');
  const metadata = await fetch(`${graphBase}/${mediaId}`, { headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` } });
  if (!metadata.ok) throw new Error(`WhatsApp media metadata failed: ${metadata.status} ${await metadata.text()}`);
  const { url, mime_type: mimeType } = (await metadata.json()) as { url: string; mime_type: string };
  const media = await fetch(url, { headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` } });
  if (!media.ok) throw new Error(`WhatsApp media download failed: ${media.status} ${await media.text()}`);
  const bytes = Buffer.from(await media.arrayBuffer());
  return { mimeType, base64: bytes.toString('base64') };
}

export async function sendWhatsAppText(to: string, body: string): Promise<void> {
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    console.log(`[dev] WhatsApp reply to ${to}: ${body}`);
    return;
  }
  const response = await fetch(`${graphBase}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { preview_url: false, body } }),
  });
  if (!response.ok) throw new Error(`WhatsApp send failed: ${response.status} ${await response.text()}`);
}
