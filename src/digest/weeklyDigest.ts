import { supabaseEnabled, supabaseRequest } from '../db/supabase.js';
import { env } from '../config/env.js';
import { WAEC_JAMB_SYLLABUS } from '../prompts/socratic.js';
import { sendWhatsAppText } from '../whatsapp/client.js';

interface StudentRow { id: string; whatsapp_phone: string }
interface StruggleRow {
  topic_id: string;
  difficulty: 'unknown' | 'easy' | 'medium' | 'hard';
  nudge_count: number;
  answer_leak_block_count: number;
  outcome: 'in_progress' | 'understood' | 'needs_review' | 'gave_answer';
}

interface WeakTopic {
  topicId: string;
  topicLabel: string;
  score: number;
  attempts: number;
  avgNudges: number;
}

export interface WeeklyDigest {
  studentPhone: string;
  weakTopics: WeakTopic[];
  practiceQuestions: string[];
  body: string;
}

export async function sendWeeklyDigests(): Promise<WeeklyDigest[]> {
  const digests = await buildWeeklyDigests();
  await Promise.all(digests.map((digest) => sendWhatsAppText(digest.studentPhone, digest.body)));
  return digests;
}

export async function buildWeeklyDigests(): Promise<WeeklyDigest[]> {
  if (!supabaseEnabled) {
    return [await buildOfflineDemoDigest()];
  }

  const students = await supabaseRequest<StudentRow[]>('students?select=id,whatsapp_phone');
  const digests: WeeklyDigest[] = [];
  for (const student of students) {
    const rows = await fetchRecentStruggles(student.id);
    if (rows.length === 0) continue;
    const weakTopics = rankWeakTopics(rows).slice(0, 3);
    const practiceQuestions = await generatePracticeQuestions(weakTopics);
    digests.push({
      studentPhone: student.whatsapp_phone,
      weakTopics,
      practiceQuestions,
      body: formatDigest(weakTopics, practiceQuestions),
    });
  }
  return digests;
}

async function fetchRecentStruggles(studentId: string): Promise<StruggleRow[]> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const query = new URLSearchParams({
    select: 'topic_id,difficulty,nudge_count,answer_leak_block_count,outcome',
    student_id: `eq.${studentId}`,
    created_at: `gte.${since}`,
  });
  return supabaseRequest<StruggleRow[]>(`topic_struggles?${query.toString()}`);
}

function rankWeakTopics(rows: StruggleRow[]): WeakTopic[] {
  const byTopic = new Map<string, { score: number; attempts: number; nudges: number }>();
  for (const row of rows) {
    const current = byTopic.get(row.topic_id) ?? { score: 0, attempts: 0, nudges: 0 };
    current.attempts += 1;
    current.nudges += row.nudge_count;
    current.score += scoreRow(row);
    byTopic.set(row.topic_id, current);
  }

  return [...byTopic.entries()]
    .map(([topicId, value]) => ({
      topicId,
      topicLabel: topicLabelFor(topicId),
      score: value.score,
      attempts: value.attempts,
      avgNudges: Number((value.nudges / value.attempts).toFixed(1)),
    }))
    .sort((a, b) => b.score - a.score || b.avgNudges - a.avgNudges);
}

function scoreRow(row: StruggleRow): number {
  const difficultyScore = { unknown: 1, easy: 1, medium: 2, hard: 3 }[row.difficulty];
  const outcomeScore = row.outcome === 'needs_review' ? 3 : row.outcome === 'gave_answer' ? 2 : 1;
  return difficultyScore + outcomeScore + row.nudge_count + row.answer_leak_block_count * 2;
}

async function generatePracticeQuestions(weakTopics: WeakTopic[]): Promise<string[]> {
  const fallback = weakTopics.map((topic, index) => `${index + 1}. ${fallbackQuestionFor(topic.topicId)}`);
  if (!env.OPENAI_API_KEY || weakTopics.length === 0) return fallback.slice(0, 3);

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      input: `Create exactly ${Math.min(3, weakTopics.length)} WAEC/JAMB-style practice questions for these weak topics: ${JSON.stringify(weakTopics)}. Return only a numbered list. Do not include answers.`,
    }),
  });
  if (!response.ok) return fallback.slice(0, 3);
  const payload = (await response.json()) as { output_text?: string };
  return parseNumberedQuestions(payload.output_text).slice(0, 3).map((question, index) => `${index + 1}. ${question}`);
}

function formatDigest(weakTopics: WeakTopic[], practiceQuestions: string[]): string {
  const topicLines = weakTopics.map((topic, index) => `${index + 1}. ${topic.topicLabel} — ${topic.attempts} struggle log(s), avg nudges ${topic.avgNudges}`);
  return [
    '📚 StudyBridge weekly revision digest',
    '',
    'Your top weak topics this week:',
    ...topicLines,
    '',
    'Try these 3 practice questions:',
    ...practiceQuestions,
    '',
    'Reply with a question number when you want Socratic help.',
  ].join('\n');
}

async function buildOfflineDemoDigest(): Promise<WeeklyDigest> {
  const weakTopics = rankWeakTopics([
    { topic_id: 'math.algebra.quadratics', difficulty: 'hard', nudge_count: 4, answer_leak_block_count: 1, outcome: 'needs_review' },
    { topic_id: 'math.geometry.trigonometry', difficulty: 'medium', nudge_count: 3, answer_leak_block_count: 0, outcome: 'in_progress' },
    { topic_id: 'physics.mechanics.motion', difficulty: 'medium', nudge_count: 2, answer_leak_block_count: 0, outcome: 'needs_review' },
  ]);
  const practiceQuestions = await generatePracticeQuestions(weakTopics);
  return { studentPhone: 'dev-demo-student', weakTopics, practiceQuestions, body: formatDigest(weakTopics, practiceQuestions) };
}

function topicLabelFor(topicId: string): string {
  return WAEC_JAMB_SYLLABUS.find((topic) => topic.id === topicId)?.label ?? topicId;
}

function fallbackQuestionFor(topicId: string): string {
  switch (topicId) {
    case 'math.algebra.quadratics': return 'Solve x² - 5x + 6 = 0 by factorisation.';
    case 'math.algebra.simultaneous': return 'Solve 2x + y = 7 and x - y = 2 simultaneously.';
    case 'math.geometry.trigonometry': return 'A right triangle has opposite side 6 cm and hypotenuse 10 cm. Find sin θ.';
    case 'physics.mechanics.motion': return 'A car accelerates from rest at 2 m/s² for 5 s. Find its final velocity.';
    case 'chemistry.stoichiometry.mole': return 'How many moles are in 11 g of CO₂? Use C=12, O=16.';
    default: return `Write one exam-style question for ${topicId}.`;
  }
}

function parseNumberedQuestions(text?: string): string[] {
  if (!text) return [];
  return text.split('\n').map((line) => line.replace(/^\s*\d+[.)-]\s*/, '').trim()).filter(Boolean);
}
