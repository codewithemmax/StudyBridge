import type { SocraticReplyDecision, TutoringSession } from './socraticState.js';

// Only match when the reply is conclusively stating the final answer, not mid-explanation
const finalAnswerPatterns = [
  /\b(the\s+)?(final\s+answer|answer\s+is|solution\s+is)\s*[=:]?\s*-?[\d.]+/i,
  /\btherefore[^.]*\b(x|y|z)\s*=\s*-?[\d.]+/i,
  /\b(x|y|z)\s*=\s*-?[\d.]+\s*($|\.)/im,
  /\b(option|answer)\s+[a-d]\s+is\s+correct/i,
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
    return { reply: limitWhatsAppLength(toWhatsAppFormat(normalized || fallbackQuestion(session))), blockedAnswerLeak: false };
  }

  const leakedAnswer = finalAnswerPatterns.some((pattern) => pattern.test(normalized));
  if (leakedAnswer) {
    return {
      reply: buildSafeRedirect(session, decision.maxAnswerDetail, normalized),
      blockedAnswerLeak: true,
    };
  }

  const question = extractFirstQuestion(normalized) ?? fallbackQuestion(session);
  const reply = decision.maxAnswerDetail === 'small_hint'
    ? ensureHintThenQuestion(question, session)
    : question;

  return { reply: limitWhatsAppLength(toWhatsAppFormat(reply)), blockedAnswerLeak: false };
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

function buildSafeRedirect(session: TutoringSession, maxAnswerDetail: SocraticReplyDecision['maxAnswerDetail'], modelReply: string): string {
  // Try to salvage the part of the reply before the answer leak
  const leakIndex = finalAnswerPatterns.reduce((earliest, pattern) => {
    const match = pattern.exec(modelReply);
    return match && match.index < earliest ? match.index : earliest;
  }, modelReply.length);

  const safePrefix = modelReply.slice(0, leakIndex).trim().replace(/[,:\s]+$/, '');

  const redirectQuestion = maxAnswerDetail === 'small_hint'
    ? `What value or relationship from the question should we write down first?`
    : `What do you think the next step is?`;

  return limitWhatsAppLength(toWhatsAppFormat(safePrefix ? `${safePrefix}. ${redirectQuestion}` : redirectQuestion));
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

function toWhatsAppFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '*$1*')       // **bold** -> *bold*
    .replace(/^#{1,6}\s+(.+)$/gm, '*$1*')    // ### Heading -> *Heading*
    .replace(/^[-*]\s+/gm, '• ')             // - item / * item -> • item
    .replace(/\n{3,}/g, '\n\n')              // collapse excess blank lines
    .trim();
}
