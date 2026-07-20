import type { TutoringSession } from '../state/socraticState.js';

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

export function followUpPrompt(session: TutoringSession, studentReply: string, maxAnswerDetail: string): string {
  return `Continue this Socratic tutoring session. Topic: ${session.topicLabel}. Problem: ${session.problemSummary}.\nPrior messages: ${JSON.stringify(session.messages.slice(-8))}.\nStudent replied: ${studentReply}.\nGuardrail: maxAnswerDetail=${maxAnswerDetail}. If question_only, ask exactly one guiding question and do not give formulas unless asking the student to choose one. If small_hint, give one short hint then one question. If worked_answer, you may show a concise worked answer. Keep it WhatsApp-friendly.`;
}
