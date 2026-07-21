declare module 'dotenv/config';

declare const process: {
  env: Record<string, string | undefined>;
};

declare const Buffer: {
  from(input: ArrayBuffer | string): { toString(encoding: 'base64'): string };
};

declare module 'express' {
  export interface Request {
    query: Record<string, unknown>;
    body: unknown;
  }
  export interface Response {
    status(code: number): Response;
    send(body: unknown): Response;
    json(body: unknown): Response;
    sendStatus(code: number): Response;
    type(value: string): Response;
    headersSent: boolean;
  }
  export type NextFunction = (error?: unknown) => void;
  export interface RouterInstance {
    get(path: string, handler: (req: Request, res: Response, next: NextFunction) => unknown): void;
    post(path: string, handler: (req: Request, res: Response, next: NextFunction) => unknown): void;
  }
  export interface ExpressApp extends RouterInstance {
    use(...args: unknown[]): void;
    listen(port: number, callback?: () => void): void;
  }
  interface ExpressFactory {
    (): ExpressApp;
    json(options?: unknown): unknown;
    urlencoded(options?: unknown): unknown;
  }
  export function Router(): RouterInstance;
  const express: ExpressFactory;
  export default express;
}


declare module 'twilio' {
  interface MessageCreateOptions {
    from: string;
    to: string;
    body: string;
  }
  interface TwilioClient {
    messages: { create(options: MessageCreateOptions): Promise<unknown> };
  }
  export default function twilio(accountSid: string, authToken: string): TwilioClient;
}


declare module 'groq-sdk' {
  type ChatMessageContent = string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
  interface ChatCompletionCreateOptions {
    model: string;
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: ChatMessageContent }>;
    response_format?: { type: 'json_object' };
  }
  interface ChatCompletionResponse {
    choices: Array<{ message?: { content?: string | null } }>;
  }
  interface GroqClient {
    chat: { completions: { create(options: ChatCompletionCreateOptions): Promise<ChatCompletionResponse> } };
  }
  export default class Groq implements GroqClient {
    constructor(options: { apiKey: string });
    chat: GroqClient['chat'];
  }
}
