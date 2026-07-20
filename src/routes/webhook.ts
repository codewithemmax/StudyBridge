import { Router } from 'express';
import { env } from '../config/env.js';
import { persistSessionStarted, persistSessionTurn } from '../db/learningLog.js';
import { analyzeProblemImage } from '../openai/vision.js';
import { generateFollowUp } from '../openai/tutor.js';
import { enforceSocraticGuardrail } from '../state/guardrails.js';
import { advanceAfterAssistantReply, decisionFor, recordStudentReply, upsertSessionFromIntake } from '../state/socraticState.js';
import { downloadWhatsAppMedia, sendWhatsAppText } from '../whatsapp/client.js';

export const webhookRouter = Router();

webhookRouter.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === env.VERIFY_TOKEN && typeof challenge === 'string') return res.status(200).send(challenge);
  return res.sendStatus(403);
});

webhookRouter.post('/webhook', async (req, res, next) => {
  res.sendStatus(200);
  try {
    const messages = extractMessages(req.body);
    await Promise.all(messages.map(handleMessage));
  } catch (error) {
    next(error);
  }
});

async function handleMessage(message: InboundMessage): Promise<void> {
  if (message.type === 'image' && message.image?.id) {
    const image = await downloadWhatsAppMedia(message.image.id);
    const analysis = await analyzeProblemImage(image, message.image.caption);
    const session = upsertSessionFromIntake({ studentPhone: message.from, ...analysis, firstPrompt: analysis.firstQuestion });
    await persistSessionStarted(session);
    await sendWhatsAppText(message.from, analysis.firstQuestion);
    return;
  }

  if (message.type === 'text' && message.text?.body) {
    const session = recordStudentReply(message.from, message.text.body);
    if (!session) {
      await sendWhatsAppText(message.from, 'Please send a photo of the homework problem first so I can anchor our tutoring session to your syllabus.');
      return;
    }
    const decision = decisionFor(session);
    const modelReply = await generateFollowUp(session, message.text.body, decision);
    const guarded = enforceSocraticGuardrail(session, modelReply, decision);
    advanceAfterAssistantReply(session, guarded.reply, guarded.blockedAnswerLeak);
    await persistSessionTurn(session);
    await sendWhatsAppText(message.from, guarded.reply);
  }
}

interface InboundMessage {
  from: string;
  type: 'text' | 'image' | string;
  text?: { body?: string };
  image?: { id?: string; caption?: string };
}

function extractMessages(body: unknown): InboundMessage[] {
  const entries = (body as { entry?: Array<{ changes?: Array<{ value?: { messages?: InboundMessage[] } }> }> }).entry ?? [];
  return entries.flatMap((entry) => entry.changes ?? []).flatMap((change) => change.value?.messages ?? []);
}
