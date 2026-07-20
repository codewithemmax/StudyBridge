import { env } from '../config/env.js';
import { intakePrompt, WAEC_JAMB_SYLLABUS } from '../prompts/socratic.js';

export interface IntakeAnalysis {
  problemSummary: string;
  topicId: string;
  topicLabel: string;
  firstQuestion: string;
}

export async function analyzeProblemImage(image: { mimeType: string; base64: string }, caption?: string): Promise<IntakeAnalysis> {
  if (!env.OPENAI_API_KEY) {
    return offlineIntake(caption);
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: `${intakePrompt()}\nCaption: ${caption ?? ''}` },
            { type: 'input_image', image_url: `data:${image.mimeType};base64,${image.base64}` },
          ],
        },
      ],
      text: { format: { type: 'json_object' } },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI intake failed: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as { output_text?: string };
  return normalizeIntake(JSON.parse(payload.output_text ?? '{}'));
}

function offlineIntake(caption?: string): IntakeAnalysis {
  return normalizeIntake({
    problemSummary: caption || 'Image received; configure OPENAI_API_KEY to parse the exact problem.',
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
