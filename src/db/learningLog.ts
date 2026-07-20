import { supabaseEnabled, supabaseRequest } from './supabase.js';
import type { TutoringSession } from '../state/socraticState.js';

interface StudentRow { id: string; whatsapp_phone: string }

export async function persistSessionStarted(session: TutoringSession): Promise<void> {
  await safelyPersist(async () => {
    const student = await upsertStudent(session.studentPhone);
    await upsertSession(session, student.id);
    const firstMessage = session.messages[0];
    if (firstMessage) await insertMessage(session.id, firstMessage.role, firstMessage.content, firstMessage.metadata ?? {});
  });
}

export async function persistSessionTurn(session: TutoringSession): Promise<void> {
  await safelyPersist(async () => {
    const student = await upsertStudent(session.studentPhone);
    await upsertSession(session, student.id);
    const latestMessages = session.messages.slice(-2);
    await Promise.all(latestMessages.map((message) => insertMessage(session.id, message.role, message.content, message.metadata ?? {})));
    await insertStruggleSnapshot(session, student.id);
  });
}

async function upsertStudent(whatsappPhone: string): Promise<StudentRow> {
  const rows = await supabaseRequest<StudentRow[]>('students?on_conflict=whatsapp_phone', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    body: [{ whatsapp_phone: whatsappPhone, updated_at: new Date().toISOString() }],
  });
  return rows[0];
}

async function upsertSession(session: TutoringSession, studentId: string): Promise<void> {
  await supabaseRequest('tutoring_sessions?on_conflict=id', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    body: [{
      id: session.id,
      student_id: studentId,
      topic_id: session.topicId,
      problem_summary: session.problemSummary,
      status: 'active',
      difficulty: difficultyFromNudges(session.nudgeCount),
      stage: session.stage,
      nudge_count: session.nudgeCount,
      student_attempt_count: session.studentAttemptCount,
      direct_answer_request_count: session.directAnswerRequestCount,
      answer_leak_block_count: session.answerLeakBlockCount,
      outcome: outcomeFromSession(session),
      updated_at: session.updatedAt,
    }],
  });
}

async function insertMessage(sessionId: string, role: string, content: string, metadata: Record<string, string | number | boolean>): Promise<void> {
  await supabaseRequest('tutoring_messages', {
    method: 'POST',
    prefer: 'return=minimal',
    body: [{ session_id: sessionId, role, content, metadata }],
  });
}

async function insertStruggleSnapshot(session: TutoringSession, studentId: string): Promise<void> {
  await supabaseRequest('topic_struggles', {
    method: 'POST',
    prefer: 'return=minimal',
    body: [{
      student_id: studentId,
      topic_id: session.topicId,
      session_id: session.id,
      difficulty: difficultyFromNudges(session.nudgeCount),
      nudge_count: session.nudgeCount,
      answer_leak_block_count: session.answerLeakBlockCount,
      outcome: outcomeFromSession(session),
    }],
  });
}

function difficultyFromNudges(nudgeCount: number): 'unknown' | 'easy' | 'medium' | 'hard' {
  if (nudgeCount <= 1) return 'easy';
  if (nudgeCount <= 3) return 'medium';
  return 'hard';
}

function outcomeFromSession(session: TutoringSession): 'in_progress' | 'understood' | 'needs_review' | 'gave_answer' {
  if (session.stage === 'final_answer_allowed') return 'gave_answer';
  if (session.answerLeakBlockCount > 0 || session.directAnswerRequestCount >= 2) return 'needs_review';
  return 'in_progress';
}

async function safelyPersist(write: () => Promise<void>): Promise<void> {
  if (!supabaseEnabled) {
    console.log('[dev] Supabase disabled; skipping learning log write.');
    return;
  }
  try {
    await write();
  } catch (error) {
    console.error('[warn] Supabase learning log write failed:', error);
  }
}
