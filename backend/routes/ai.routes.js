import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { authUser } from '../middleware/auth.middleware.js';
import { aiRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// POST /ai/get-result - Authenticated, rate-limited AI prompt execution
router.post('/get-result', authUser, aiRateLimiter, aiController.getResult);

// Explicit 405 Method Not Allowed if GET is attempted
router.get('/get-result', (req, res) => {
    res.status(405).json({
        error: 'Method Not Allowed. AI generation requires POST /ai/get-result with a valid Bearer token and JSON body: { "prompt": "..." }'
    });
});

export default router;