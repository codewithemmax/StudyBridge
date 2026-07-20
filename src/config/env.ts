import 'dotenv/config';

export const env = {
  PORT: positiveInt(process.env.PORT, 3000),
  TWILIO_ACCOUNT_SID: nonEmpty(process.env.TWILIO_ACCOUNT_SID),
  TWILIO_AUTH_TOKEN: nonEmpty(process.env.TWILIO_AUTH_TOKEN),
  TWILIO_PHONE_NUMBER: nonEmpty(process.env.TWILIO_PHONE_NUMBER),
  OPENAI_API_KEY: nonEmpty(process.env.OPENAI_API_KEY),
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-5.6',
  SUPABASE_URL: nonEmpty(process.env.SUPABASE_URL),
  SUPABASE_KEY: nonEmpty(process.env.SUPABASE_SERVICE_ROLE_KEY) ?? nonEmpty(process.env.SUPABASE_ANON_KEY),
  CRON_SECRET: nonEmpty(process.env.CRON_SECRET),
};

function nonEmpty(value: string | undefined): string | undefined {
  return value && value.trim().length > 0 ? value : undefined;
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
