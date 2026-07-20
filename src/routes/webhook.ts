import { Router } from 'express';
import { persistSessionStarted, persistSessionTurn } from '../db/learningLog.js';
import { analyzeProblemImage } from '../openai/vision.js';
import { generateFollowUp } from '../openai/tutor.js';
import { enforceSocraticGuardrail } from '../state/guardrails.js';
import { advanceAfterAssistantReply, decisionFor, recordStudentReply, upsertSessionFromIntake } from '../state/socraticState.js';
import { downloadWhatsAppMedia, sendWhatsAppText } from '../whatsapp/client.js';

export const webhookRouter = Router();

webhookRouter.post('/webhook', (req, res) => {
  res.type('text/xml').status(200).send('<Response></Response>');
  void handleTwilioWebhook(req.body).catch((error) => {
    console.error('[warn] async Twilio webhook handling failed:', error);
  });
});

async function handleTwilioWebhook(body: unknown): Promise<void> {
  const message = extractTwilioMessage(body);
  if (!message.from) return;

  if (message.mediaUrl && message.mediaContentType?.startsWith('image/')) {
    const image = await downloadWhatsAppMedia(message.mediaUrl, message.mediaContentType);
    const analysis = await analyzeProblemImage(image, message.body);
    const session = upsertSessionFromIntake({ studentPhone: message.from, ...analysis, firstPrompt: analysis.firstQuestion });
    await persistSessionStarted(session);
    await sendWhatsAppText(message.from, analysis.firstQuestion);
    return;
  }

  if (message.body) {
    const session = recordStudentReply(message.from, message.body);
    if (!session) {
      await sendWhatsAppText(message.from, 'Please send a photo of the homework problem first so I can anchor our tutoring session to your syllabus.');
      return;
    }
    const decision = decisionFor(session);
    const modelReply = await generateFollowUp(session, message.body, decision);
    const guarded = enforceSocraticGuardrail(session, modelReply, decision);
    advanceAfterAssistantReply(session, guarded.reply, guarded.blockedAnswerLeak);
    await persistSessionTurn(session);
    await sendWhatsAppText(message.from, guarded.reply);
  }
}

interface TwilioInboundMessage {
  from: string;
  body: string;
  mediaUrl?: string;
  mediaContentType?: string;
}

function extractTwilioMessage(body: unknown): TwilioInboundMessage {
  const payload = body as Record<string, string | undefined>;
  const numMedia = Number(payload.NumMedia ?? '0');
  return {
    from: payload.From ?? '',
    body: payload.Body ?? '',
    mediaUrl: numMedia > 0 ? payload.MediaUrl0 : undefined,
    mediaContentType: numMedia > 0 ? payload.MediaContentType0 : undefined,
  };
}
