import Groq from 'groq-sdk';
import { env } from '../config/env.js';
import { followUpPrompt } from '../prompts/socratic.js';
import type { SocraticReplyDecision, TutoringSession } from '../state/socraticState.js';

const groq = env.GROQ_API_KEY ? new Groq({ apiKey: env.GROQ_API_KEY }) : undefined;
const GROQ_MODEL = 'qwen/qwen3.6-27b';

export async function generateFollowUp(session: TutoringSession, studentReply: string, decision: SocraticReplyDecision): Promise<string> {
  if (!groq) {
    return decision.maxAnswerDetail === 'small_hint'
      ? 'Small hint: write down the known values first. Which one matches the unknown you need to find?'
      : 'What step can you take next using the information already given in the question?';
  }

  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: followUpPrompt(session, studentReply, decision) }],
  });

  return response.choices[0]?.message?.content?.trim() || 'What do you think the next step should be?';
}
