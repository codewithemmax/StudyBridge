import type { SocraticReplyDecision, TutoringSession } from '../state/socraticState.js';

export const WAEC_JAMB_SYLLABUS = [
  { id: 'math.algebra.quadratics', label: 'Mathematics > Algebra > Quadratic equations' },
  { id: 'math.algebra.simultaneous', label: 'Mathematics > Algebra > Simultaneous equations' },
  { id: 'math.geometry.trigonometry', label: 'Mathematics > Geometry > Trigonometry' },
  { id: 'physics.mechanics.motion', label: 'Physics > Mechanics > Motion' },
  { id: 'chemistry.stoichiometry.mole', label: 'Chemistry > Stoichiometry > Mole concept' },
] as const;

export function intakePrompt(): string {
  return `You are StudyBridge, a WhatsApp-native Socratic tutor for WAEC/JAMB students.\nIdentify the problem, map it to exactly one syllabus topic from this scaffold: ${JSON.stringify(WAEC_JAMB_SYLLABUS)}.\nReturn JSON with keys: problemSummary, topicId, topicLabel, firstQuestion. firstQuestion must be one Socratic question only and must not reveal the final answer.`;
}

export function followUpPrompt(session: TutoringSession, studentReply: string, decision: SocraticReplyDecision): string {
  return `Continue this Socratic tutoring session.
Topic: ${session.topicLabel}.
Problem: ${session.problemSummary}.
Current state: ${session.stage}. Nudges used: ${session.nudgeCount}. Student attempts: ${session.studentAttemptCount}. Direct-answer requests: ${session.directAnswerRequestCount}.
Prior messages: ${JSON.stringify(session.messages.slice(-8))}.
Student replied: ${studentReply}.
Hard guardrail: allowFinalAnswer=${decision.allowFinalAnswer}; maxAnswerDetail=${decision.maxAnswerDetail}; reason=${decision.reason}.
If allowFinalAnswer=false, do not reveal the numeric/symbolic final answer, do not say "the answer is", and do not complete all steps. If maxAnswerDetail=question_only, ask exactly one guiding question. If maxAnswerDetail=small_hint, give one short hint then one question. If allowFinalAnswer=true, you may show a concise worked answer.
FORMATTING RULES — this message will be sent on WhatsApp:
- Use *text* for bold (single asterisk, NOT double)
- Use _text_ for italic (single underscore)
- Use plain numbered lists: 1. 2. 3.
- Do NOT use markdown headers (###), do NOT use **double asterisks**, do NOT use bullet dashes (- item)
- Keep it short and conversational, max 3 short paragraphs`;
}
