import { Router } from 'express';
import { persistSessionStarted, persistSessionTurn } from '../db/learningLog.js';
import { analyzeProblemImage } from '../openai/vision.js';
import { generateFollowUp } from '../openai/tutor.js';
import { enforceSocraticGuardrail } from '../state/guardrails.js';
import { advanceAfterAssistantReply, decisionFor, recordStudentReply, upsertSessionFromIntake } from '../state/socraticState.js';
import { sendWhatsAppText } from '../whatsapp/client.js';

export const webhookRouter = Router();

webhookRouter.get('/webhook', (_req, res) => {
  console.log('[webhook] GET hit — endpoint is reachable');
  res.status(200).send('StudyBridge webhook is live.');
});

webhookRouter.post('/webhook', (req, res) => {
  console.log('[webhook] POST hit — body:', JSON.stringify(req.body));
  res.type('text/xml').status(200).send('<Response></Response>');
  void handleTwilioWebhook(req.body).catch((error) => {
    console.error('[webhook] async handling failed:', error);
  });
});

async function handleTwilioWebhook(body: unknown): Promise<void> {
  const message = extractTwilioMessage(body);
  console.log('[handleTwilioWebhook] extracted — from:', message.from, '| body:', message.body, '| mediaUrl:', message.mediaUrl, '| mediaContentType:', message.mediaContentType);

  if (!message.from) {
    console.warn('[handleTwilioWebhook] No "from" field — ignoring. Raw body was:', JSON.stringify(body));
    return;
  }

  if (message.mediaUrl && message.mediaContentType?.startsWith('image/')) {
    console.log('[handleTwilioWebhook] Image message — forwarding media URL to Groq:', message.mediaUrl);
    const analysis = await analyzeProblemImage({ url: message.mediaUrl }, message.body);
    console.log('[handleTwilioWebhook] Groq analysis:', JSON.stringify(analysis));
    const session = upsertSessionFromIntake({ studentPhone: message.from, ...analysis, firstPrompt: analysis.firstQuestion });
    console.log('[handleTwilioWebhook] Session created — id:', session.id);
    await persistSessionStarted(session);
    console.log('[handleTwilioWebhook] Session persisted to DB');
    await sendWhatsAppText(message.from, analysis.firstQuestion);
    console.log('[handleTwilioWebhook] First question sent to:', message.from);
    return;
  }

  if (message.body) {
    console.log('[handleTwilioWebhook] Text message from:', message.from);
    const session = recordStudentReply(message.from, message.body);
    if (!session) {
      console.warn('[handleTwilioWebhook] No active session for:', message.from, '— sending onboarding prompt');
      await sendWhatsAppText(message.from, 'Please send a photo of the homework problem first so I can anchor our tutoring session to your syllabus.');
      return;
    }
    console.log('[handleTwilioWebhook] Session found — stage:', session.stage, '| nudgeCount:', session.nudgeCount);
    const decision = decisionFor(session);
    console.log('[handleTwilioWebhook] Decision:', JSON.stringify(decision));
    const modelReply = await generateFollowUp(session, message.body, decision);
    console.log('[handleTwilioWebhook] Model reply:', modelReply);
    const guarded = enforceSocraticGuardrail(session, modelReply, decision);
    console.log('[handleTwilioWebhook] Guarded reply:', guarded.reply, '| blockedAnswerLeak:', guarded.blockedAnswerLeak);
    advanceAfterAssistantReply(session, guarded.reply, guarded.blockedAnswerLeak);
    await persistSessionTurn(session);
    await sendWhatsAppText(message.from, guarded.reply);
    console.log('[handleTwilioWebhook] Reply sent to:', message.from);
  } else {
    console.warn('[handleTwilioWebhook] Message had no body and no image — from:', message.from);
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
