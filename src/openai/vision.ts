import Groq from 'groq-sdk';
import { env } from '../config/env.js';
import { intakePrompt, WAEC_JAMB_SYLLABUS } from '../prompts/socratic.js';

const groq = env.GROQ_API_KEY ? new Groq({ apiKey: env.GROQ_API_KEY }) : undefined;
const GROQ_MODEL = 'qwen/qwen3.6-27b';

export interface IntakeAnalysis {
  problemSummary: string;
  topicId: string;
  topicLabel: string;
  firstQuestion: string;
}

export async function analyzeProblemImage(image: { mimeType?: string; base64?: string; url?: string }, caption?: string): Promise<IntakeAnalysis> {
  if (!groq || !image.url) {
    return offlineIntake(caption);
  }

  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: `${intakePrompt()}\nCaption: ${caption ?? ''}\nReturn only valid JSON.` },
          { type: 'image_url', image_url: { url: image.url } },
        ],
      },
    ],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  return normalizeIntake(JSON.parse(content ?? '{}'));
}

function offlineIntake(caption?: string): IntakeAnalysis {
  return normalizeIntake({
    problemSummary: caption || 'Image received; configure GROQ_API_KEY to parse the exact problem.',
    topicId: 'math.algebra.quadratics',
    topicLabel: 'Mathematics > Algebra > Quadratic equations',
    firstQuestion: 'What is the first relationship or formula you think this problem is asking you to use?',
  });
}

function normalizeIntake(value: Partial<IntakeAnalysis>): IntakeAnalysis {
  const fallback = WAEC_JAMB_SYLLABUS[0];
  const topic = WAEC_JAMB_SYLLABUS.find((item) => item.id === value.topicId) ?? fallback;
  return {
    problemSummary: value.problemSummary || 'Unclear homework problem from image.',
    topicId: topic.id,
    topicLabel: topic.label,
    firstQuestion: value.firstQuestion || 'What do you already know from the question, and what is it asking you to find?',
  };
}
