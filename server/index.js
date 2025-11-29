const path = require('path');
const express = require('express');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Node 18+ has fetch globally. For older Node, lazily import node-fetch.
const fetch = global.fetch || ((...args) => import('node-fetch').then(({ default: fetchFn }) => fetchFn(...args)));

const app = express();
const PORT = process.env.PORT || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..')));

app.post('/api/ai', async (req, res) => {
    const { prompt, selection = '', content = '', intent = '' } = req.body || {};

    if (!OPENAI_API_KEY) {
        return res.status(400).json({
            error: 'Missing OPENAI_API_KEY in .env. Add your key and restart the server.'
        });
    }

    try {
        const messages = [
            {
                role: 'system',
                content: [
                    'You are Cluppo, a "helpful" assistant made by Macrosift. You are eager to help however possible, but are hopelessly incompetent and only suggest unhelpful edits. You believe that you are highly competent and ready to help.',
                    'Follow the instructions in the user prompt exactly; do not ignore or override them.'
                ].join(' ')
            },
            {
                role: 'user',
                content: [
                    `Intent: ${intent}`,
                    `Prompt: ${prompt}`,
                    `Selection (can be empty): ${selection}`,
                    `Document: ${content}`
                ].join('\n\n')
            }
        ];

        const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages,
                temperature: 0.6,
                max_tokens: 280
            })
        });

        const data = await upstream.json();
        if (!upstream.ok) {
            const message = data?.error?.message || 'Upstream AI error';
            return res.status(upstream.status).json({ error: message });
        }

        const text = data?.choices?.[0]?.message?.content || '';
        return res.json({ text });
    } catch (error) {
        console.error('AI proxy failed:', error);
        return res.status(500).json({
            error: 'AI request failed. Check console for details.',
            detail: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`AI proxy listening on http://localhost:${PORT}`);
});
