import { classifyStudentIntent } from './guardrails.js';

export type SocraticStage = 'intake' | 'concept_identified' | 'nudge_1' | 'nudge_2' | 'hint_allowed' | 'final_answer_allowed';
export type StudentIntent = 'direct_answer_request' | 'attempt' | 'unclear';

export interface TutoringMessage {
  role: 'student' | 'assistant' | 'system';
  content: string;
  at: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface TutoringSession {
  id: string;
  studentPhone: string;
  problemSummary: string;
  topicId: string;
  topicLabel: string;
  stage: SocraticStage;
  nudgeCount: number;
  studentAttemptCount: number;
  directAnswerRequestCount: number;
  answerLeakBlockCount: number;
  messages: TutoringMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SocraticReplyDecision {
  stage: SocraticStage;
  allowFinalAnswer: boolean;
  maxAnswerDetail: 'question_only' | 'small_hint' | 'worked_answer';
  reason: string;
}

const sessions = new Map<string, TutoringSession>();

export function upsertSessionFromIntake(input: Omit<TutoringSession, 'id' | 'stage' | 'nudgeCount' | 'studentAttemptCount' | 'directAnswerRequestCount' | 'answerLeakBlockCount' | 'messages' | 'createdAt' | 'updatedAt'> & { firstPrompt: string }): TutoringSession {
  const now = new Date().toISOString();
  const session: TutoringSession = {
    id: `${input.studentPhone}-${Date.now()}`,
    studentPhone: input.studentPhone,
    problemSummary: input.problemSummary,
    topicId: input.topicId,
    topicLabel: input.topicLabel,
    stage: 'nudge_1',
    nudgeCount: 1,
    studentAttemptCount: 0,
    directAnswerRequestCount: 0,
    answerLeakBlockCount: 0,
    messages: [{ role: 'assistant', content: input.firstPrompt, at: now, metadata: { stage: 'nudge_1' } }],
    createdAt: now,
    updatedAt: now,
  };
  sessions.set(input.studentPhone, session);
  return session;
}

export function getSession(studentPhone: string): TutoringSession | undefined {
  return sessions.get(studentPhone);
}

export function recordStudentReply(studentPhone: string, content: string): TutoringSession | undefined {
  const session = sessions.get(studentPhone);
  if (!session) return undefined;
  const intent = classifyStudentIntent(content);
  if (intent === 'attempt') session.studentAttemptCount += 1;
  if (intent === 'direct_answer_request') session.directAnswerRequestCount += 1;
  session.messages.push({ role: 'student', content, at: new Date().toISOString(), metadata: { intent } });
  session.updatedAt = new Date().toISOString();
  return session;
}

export function decisionFor(session: TutoringSession): SocraticReplyDecision {
  if (session.stage === 'final_answer_allowed') {
    return { stage: session.stage, allowFinalAnswer: true, maxAnswerDetail: 'worked_answer', reason: 'final-answer stage reached' };
  }

  if (session.studentAttemptCount >= 2 && session.nudgeCount >= 3) {
    return { stage: 'final_answer_allowed', allowFinalAnswer: true, maxAnswerDetail: 'worked_answer', reason: 'student made at least two attempts after three nudges' };
  }

  if (session.stage === 'hint_allowed' || session.nudgeCount >= 2 || session.directAnswerRequestCount >= 2) {
    return { stage: 'hint_allowed', allowFinalAnswer: false, maxAnswerDetail: 'small_hint', reason: 'student needs constrained help but final answer is still gated' };
  }

  return { stage: session.stage, allowFinalAnswer: false, maxAnswerDetail: 'question_only', reason: 'early Socratic nudge stage' };
}

export function advanceAfterAssistantReply(session: TutoringSession, content: string, blockedAnswerLeak = false): SocraticReplyDecision {
  const decision = decisionFor(session);
  const now = new Date().toISOString();
  session.messages.push({ role: 'assistant', content, at: now, metadata: { stage: decision.stage, blockedAnswerLeak } });
  session.nudgeCount += decision.allowFinalAnswer ? 0 : 1;
  if (blockedAnswerLeak) session.answerLeakBlockCount += 1;
  session.stage = nextStage(session, decision);
  session.updatedAt = now;
  return decisionFor(session);
}

function nextStage(session: TutoringSession, decision: SocraticReplyDecision): SocraticStage {
  if (decision.allowFinalAnswer) return 'final_answer_allowed';
  if (decision.maxAnswerDetail === 'small_hint') return 'hint_allowed';
  if (session.stage === 'nudge_1') return 'nudge_2';
  if (session.stage === 'nudge_2') return 'hint_allowed';
  return session.stage;
}
