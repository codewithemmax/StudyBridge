import { env } from '../config/env.js';
import { followUpPrompt } from '../prompts/socratic.js';
import type { TutoringSession } from '../state/socraticState.js';

export async function generateFollowUp(session: TutoringSession, studentReply: string, maxAnswerDetail: string): Promise<string> {
  if (!env.OPENAI_API_KEY) {
    return maxAnswerDetail === 'small_hint'
      ? 'Small hint: write down the known values first. Which one matches the unknown you need to find?'
      : 'What step can you take next using the information already given in the question?';
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: env.OPENAI_MODEL, input: followUpPrompt(session, studentReply, maxAnswerDetail) }),
  });

  if (!response.ok) throw new Error(`OpenAI follow-up failed: ${response.status} ${await response.text()}`);
  const payload = (await response.json()) as { output_text?: string };
  return payload.output_text?.trim() || 'What do you think the next step should be?';
}
