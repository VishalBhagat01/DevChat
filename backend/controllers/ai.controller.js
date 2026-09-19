import * as ai from '../services/ai.service.js';

export const getResult = async (req, res) => {
    try {
        const prompt = req.body?.prompt ?? req.query?.prompt;

        if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
            return res.status(400).json({
                error: 'Prompt is required and must be a non-empty string'
            });
        }

        const trimmedPrompt = prompt.trim();
        if (trimmedPrompt.length > 20000) {
            return res.status(400).json({
                error: 'Prompt exceeds maximum allowed length of 20,000 characters'
            });
        }

        const result = await ai.generateResult(trimmedPrompt);
        res.status(200).send(result);
    } catch (error) {
        console.error('[AI Controller Error]', error.message || error);
        res.status(500).json({
            error: error.message || 'Failed to generate AI response'
        });
    }
};