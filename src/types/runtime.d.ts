declare module 'dotenv/config';

declare const process: {
  env: Record<string, string | undefined>;
};

declare const Buffer: {
  from(input: ArrayBuffer): { toString(encoding: 'base64'): string };
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
  }
  export function Router(): RouterInstance;
  const express: ExpressFactory;
  export default express;
}
