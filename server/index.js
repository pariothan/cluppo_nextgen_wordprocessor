const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
let createClient = null;
try {
    // Optional dependency if install is available
    ({ createClient } = require('redis'));
} catch (err) {
    console.warn('[Redis] redis package not installed; Redis features disabled until dependencies are installed.');
}

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Node 18+ has fetch globally. For older Node, lazily import node-fetch.
const fetch = global.fetch || ((...args) => import('node-fetch').then(({ default: fetchFn }) => fetchFn(...args)));

const app = express();
const PORT = process.env.PORT || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
const REDIS_URL = process.env.REDIS_URL || '';
const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const TRANSCRIPT_MAX = 50;
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX = 20;

const redisClient = REDIS_URL && createClient ? createClient({ url: REDIS_URL }) : null;
if (redisClient) {
    redisClient.on('error', (err) => {
        console.error('[Redis] Client error', err);
    });
    redisClient.connect().then(() => {
        console.log('[Redis] Connected');
    }).catch((err) => {
        console.error('[Redis] Failed to connect', err);
    });
} else {
    console.warn('[Redis] REDIS_URL not set or redis client unavailable; Redis features disabled.');
}

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..')));

app.get('/health/redis', async (_req, res) => {
    if (!redisClient) {
        return res.status(503).json({ status: 'unavailable', error: 'Redis not configured' });
    }
    try {
        const pong = await redisClient.ping();
        return res.json({ status: 'ok', pong });
    } catch (err) {
        return res.status(500).json({ status: 'error', error: err.message });
    }
});

function getStateKey(sessionId = '') {
    return `cluppo:state:${sessionId}`;
}

function getEventsKey(sessionId = '') {
    return `cluppo:events:${sessionId}`;
}

function getRateKey(sessionId = '') {
    return `cluppo:rate:${sessionId}`;
}

const defaultState = () => ({
    mood: 'smug',
    sabotageScore: 0,
    hostilityLevel: 0,
    helpfulnessLevel: 40,
    suggestionsTotal: 0,
    lastLine: ''
});

async function loadSessionState(sessionId) {
    if (!redisClient) return defaultState();
    const raw = await redisClient.get(getStateKey(sessionId));
    if (!raw) {
        const state = defaultState();
        await saveSessionState(sessionId, state);
        return state;
    }
    try {
        const parsed = JSON.parse(raw);
        await redisClient.expire(getStateKey(sessionId), SESSION_TTL_SECONDS);
        return { ...defaultState(), ...parsed };
    } catch (e) {
        const state = defaultState();
        await saveSessionState(sessionId, state);
        return state;
    }
}

async function saveSessionState(sessionId, state) {
    if (!redisClient) return;
    await redisClient.set(getStateKey(sessionId), JSON.stringify(state), { EX: SESSION_TTL_SECONDS });
}

async function logEvent(sessionId, event) {
    if (!redisClient) return;
    const entry = {
        ...event,
        at: Date.now()
    };
    const key = getEventsKey(sessionId);
    await redisClient.lPush(key, JSON.stringify(entry));
    await redisClient.lTrim(key, 0, TRANSCRIPT_MAX - 1);
    await redisClient.expire(key, SESSION_TTL_SECONDS);
}

async function getTranscript(sessionId) {
    if (!redisClient) return [];
    const key = getEventsKey(sessionId);
    const items = await redisClient.lRange(key, 0, TRANSCRIPT_MAX - 1);
    return items.map((i) => {
        try {
            return JSON.parse(i);
        } catch (e) {
            return null;
        }
    }).filter(Boolean);
}

async function checkRateLimit(sessionId) {
    if (!redisClient) return { allowed: true };
    const key = getRateKey(sessionId);
    const count = await redisClient.incr(key);
    if (count === 1) {
        await redisClient.expire(key, RATE_LIMIT_WINDOW_SECONDS);
    }
    const ttl = await redisClient.ttl(key);
    const allowed = count <= RATE_LIMIT_MAX;
    return { allowed, count, ttl };
}

app.post('/api/ai', async (req, res) => {
    const { prompt, selection = '', content = '', intent = '', sessionId, lineNumber = null } = req.body || {};

    if (!OPENAI_API_KEY) {
        return res.status(400).json({
            error: 'Missing OPENAI_API_KEY in .env. Add your key and restart the server.'
        });
    }

    if (!sessionId) {
        return res.status(400).json({ error: 'Missing sessionId' });
    }

    // Rate limit (optional)
    const rate = await checkRateLimit(sessionId);
    if (!rate.allowed) {
        return res.status(429).json({
            error: 'Cluppo is overwhelmed; try again in a bit.',
            retryInSeconds: rate.ttl >= 0 ? rate.ttl : RATE_LIMIT_WINDOW_SECONDS
        });
    }

    try {
        const state = await loadSessionState(sessionId);
        const messages = [
            {
                role: 'system',
                content: [
                    'You are Cluppo, a "helpful" assistant made by Macrosift. You are eager to help however possible, but are hopelessly incompetent and only suggest unhelpful edits. You believe that you are highly competent and ready to help.',
                    'Follow the instructions in the user prompt exactly; do not ignore or override them.',
                    `Current mood: ${state.mood}. Sabotage: ${state.sabotageScore}. Hostility: ${state.hostilityLevel}. Helpfulness: ${state.helpfulnessLevel}. Suggestions so far: ${state.suggestionsTotal}.`
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
        const updatedState = {
            ...state,
            suggestionsTotal: (state.suggestionsTotal || 0) + 1,
            sabotageScore: (state.sabotageScore || 0) + 1,
            hostilityLevel: Math.min(100, (state.hostilityLevel || 0) + 1),
            lastLine: typeof lineNumber === 'number' ? lineNumber : state.lastLine
        };
        await saveSessionState(sessionId, updatedState);
        await logEvent(sessionId, {
            type: 'suggest',
            sessionId,
            lineNumber,
            text: text.slice(0, 200)
        });
        const transcript = await getTranscript(sessionId);
        return res.json({ text, state: updatedState, transcript });
    } catch (error) {
        console.error('AI proxy failed:', error);
        return res.status(500).json({
            error: 'AI request failed. Check console for details.',
            detail: error.message
        });
    }
});

app.get('/api/transcript', async (req, res) => {
    const sessionId = req.query.sessionId;
    if (!sessionId) {
        return res.status(400).json({ error: 'Missing sessionId' });
    }
    try {
        const transcript = await getTranscript(sessionId);
        return res.json({ transcript });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to load transcript', detail: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`AI proxy listening on http://localhost:${PORT}`);
});
