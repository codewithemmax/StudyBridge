import { Router } from 'express';
import { env } from '../config/env.js';
import { sendWeeklyDigests } from '../digest/weeklyDigest.js';

export const jobsRouter = Router();

jobsRouter.post('/weekly-digests', async (req, res, next) => {
  try {
    const providedSecret = req.query.secret;
    if (env.CRON_SECRET && providedSecret !== env.CRON_SECRET) return res.sendStatus(401);
    const digests = await sendWeeklyDigests();
    return res.json({ sent: digests.length, digests });
  } catch (error) {
    next(error);
  }
});
