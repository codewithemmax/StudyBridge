export type SocraticStage = 'intake' | 'concept_identified' | 'nudge_1' | 'nudge_2' | 'hint_allowed' | 'final_answer_allowed';

export interface TutoringSession {
  studentPhone: string;
  problemSummary: string;
  topicId: string;
  topicLabel: string;
  stage: SocraticStage;
  nudgeCount: number;
  messages: Array<{ role: 'student' | 'assistant'; content: string; at: string }>;
}

export interface SocraticReplyDecision {
  stage: SocraticStage;
  allowFinalAnswer: boolean;
  maxAnswerDetail: 'question_only' | 'small_hint' | 'worked_answer';
}

const sessions = new Map<string, TutoringSession>();

export function upsertSessionFromIntake(input: Omit<TutoringSession, 'stage' | 'nudgeCount' | 'messages'> & { firstPrompt: string }): TutoringSession {
  const session: TutoringSession = {
    studentPhone: input.studentPhone,
    problemSummary: input.problemSummary,
    topicId: input.topicId,
    topicLabel: input.topicLabel,
    stage: 'nudge_1',
    nudgeCount: 1,
    messages: [{ role: 'assistant', content: input.firstPrompt, at: new Date().toISOString() }],
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
  session.messages.push({ role: 'student', content, at: new Date().toISOString() });
  return session;
}

export function advanceAfterAssistantReply(session: TutoringSession, content: string): SocraticReplyDecision {
  session.messages.push({ role: 'assistant', content, at: new Date().toISOString() });
  if (session.stage === 'nudge_1') {
    session.stage = 'nudge_2';
    session.nudgeCount += 1;
    return decisionFor(session.stage);
  }
  if (session.stage === 'nudge_2') {
    session.stage = 'hint_allowed';
    session.nudgeCount += 1;
    return decisionFor(session.stage);
  }
  if (session.stage === 'hint_allowed') {
    session.stage = 'final_answer_allowed';
    return decisionFor(session.stage);
  }
  return decisionFor(session.stage);
}

export function decisionFor(stage: SocraticStage): SocraticReplyDecision {
  switch (stage) {
    case 'final_answer_allowed':
      return { stage, allowFinalAnswer: true, maxAnswerDetail: 'worked_answer' };
    case 'hint_allowed':
      return { stage, allowFinalAnswer: false, maxAnswerDetail: 'small_hint' };
    default:
      return { stage, allowFinalAnswer: false, maxAnswerDetail: 'question_only' };
  }
}
