import type { SocraticReplyDecision, TutoringSession } from './socraticState.js';

const directAnswerPatterns = [
  /\b(final\s+answer|answer\s+is|solution\s+is|equals|=)\b/i,
  /\btherefore\b.*\b(answer|solution|x\s*=|y\s*=)\b/i,
  /\b(?:x|y|z)\s*=\s*-?\d+(?:\.\d+)?\b/i,
  /\b(?:option|answer)\s+[a-d]\b/i,
];

const questionStarters = /\b(what|which|why|how|where|when|can you|could you|do you|does|is there|are there)\b/i;

export interface GuardrailResult {
  reply: string;
  blockedAnswerLeak: boolean;
}

export function enforceSocraticGuardrail(
  session: TutoringSession,
  modelReply: string,
  decision: SocraticReplyDecision,
): GuardrailResult {
  const normalized = modelReply.trim().replace(/\s+/g, ' ');
  if (decision.allowFinalAnswer) {
    return { reply: limitWhatsAppLength(normalized || fallbackQuestion(session)), blockedAnswerLeak: false };
  }

  const leakedAnswer = directAnswerPatterns.some((pattern) => pattern.test(normalized));
  if (leakedAnswer) {
    return {
      reply: buildSafeRedirect(session, decision.maxAnswerDetail),
      blockedAnswerLeak: true,
    };
  }

  const question = extractFirstQuestion(normalized) ?? fallbackQuestion(session);
  const reply = decision.maxAnswerDetail === 'small_hint'
    ? ensureHintThenQuestion(question, session)
    : question;

  return { reply: limitWhatsAppLength(reply), blockedAnswerLeak: false };
}

export function classifyStudentIntent(message: string): 'direct_answer_request' | 'attempt' | 'unclear' {
  const normalized = message.toLowerCase();
  if (/\b(just tell me|give me the answer|what is the answer|solve it for me|final answer)\b/.test(normalized)) {
    return 'direct_answer_request';
  }
  if (/\b(i think|my answer|i got|first|next|because|therefore|=|formula)\b/.test(normalized)) {
    return 'attempt';
  }
  return 'unclear';
}

function buildSafeRedirect(session: TutoringSession, maxAnswerDetail: SocraticReplyDecision['maxAnswerDetail']): string {
  if (maxAnswerDetail === 'small_hint') {
    return `Small hint: focus on the key idea in ${session.topicLabel}. What value, relationship, or formula from the question should we write down first?`;
  }
  return `Let's not jump to the final answer yet. What is the first known quantity or relationship in this ${session.topicLabel} problem?`;
}

function ensureHintThenQuestion(question: string, session: TutoringSession): string {
  if (!questionStarters.test(question)) {
    return `Small hint: connect the given values to ${session.topicLabel}. What should we write down first?`;
  }
  return `Small hint: connect the given values to ${session.topicLabel}. ${question}`;
}

function extractFirstQuestion(text: string): string | undefined {
  const questionEnd = text.indexOf('?');
  if (questionEnd >= 0) return text.slice(0, questionEnd + 1).trim();
  if (questionStarters.test(text)) return `${text.replace(/[.!]+$/, '')}?`;
  return undefined;
}

function fallbackQuestion(session: TutoringSession): string {
  return `What is the first known quantity or relationship in this ${session.topicLabel} problem?`;
}

function limitWhatsAppLength(text: string): string {
  return text.length > 900 ? `${text.slice(0, 897).trim()}...` : text;
}
