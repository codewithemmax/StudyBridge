import express from 'express';
import { env } from './config/env.js';
import { jobsRouter } from './routes/jobs.js';
import { webhookRouter } from './routes/webhook.js';

const app = express();
app.use(express.urlencoded({ extended: false, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'studybridge-webhook' }));
app.use('/whatsapp', webhookRouter);
app.use('/jobs', jobsRouter);
app.use((error: unknown, _req: unknown, res: { headersSent: boolean; status: (code: number) => { json: (body: unknown) => void } }, _next: unknown) => {
  console.error(error);
  if (!res.headersSent) res.status(500).json({ error: 'internal_server_error' });
});

app.listen(env.PORT, () => {
  console.log(`StudyBridge webhook listening on :${env.PORT}`);
});
