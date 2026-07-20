import { env } from '../config/env.js';

export interface SupabaseRow {
  [key: string]: string | number | boolean | null | undefined | SupabaseRow | SupabaseRow[] | Record<string, unknown>;
}

export const supabaseEnabled = Boolean(env.SUPABASE_URL && env.SUPABASE_KEY);

export async function supabaseRequest<T>(path: string, options: { method?: string; body?: unknown; prefer?: string } = {}): Promise<T> {
  if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_KEY are required for database writes.');
  }

  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${path}`, {
    method: options.method ?? 'GET',
    headers: {
      apikey: env.SUPABASE_KEY,
      Authorization: `Bearer ${env.SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer ?? 'return=representation',
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed: ${response.status} ${await response.text()}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
