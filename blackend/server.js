/**
 * backend/server.js
 * - /api/run      -> exécute le code dans des conteneurs Docker (commande `docker run`),
 * - /api/ask      -> proxy vers l'API OpenAI pour le chat/assist (Ask AI)
 *
 * IMPORTANT:
 * - définir OPENAI_API_KEY dans les variables d'environnement (Render secrets).
 * - définir OPENAI_MODEL (ex: "gpt-4o" ou "gpt-4o-mini") ou laisser "gpt-4o-mini" par défaut.
 *
 * NOTE: L'exécution via Docker requiert que l'hôte supporte Docker (Render standard ne donne pas d'accès Docker).
 * Pour usage sur Render.com, il faudra adapter l'exécution (ex: services managés, remote workers) ou enlever la partie docker.
 */

const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const tmp = require('tmp');
const fetch = require('node-fetch');

const app = express();
app.use(bodyParser.json({ limit: '2mb' }));

// === CONFIG ===
const PORT = process.env.PORT || 10000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Helper: call OpenAI chat completions (simple proxy)
async function callOpenAI(messages, maxTokens = 1024) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set in environment');
  }

  const payload = {
    model: OPENAI_MODEL,
    messages: messages,
    max_tokens: maxTokens
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${txt}`);
  }
  const data = await res.json();
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content;
  }
  return JSON.stringify(data);
}

// === API: Ask AI ===
app.post('/api/ask', async (req, res) => {
  try {
    const { prompt, code, context } = req.body;

    if (!prompt) return res.status(400).json({ error: 'missing prompt' });

    const messages = [
      { role: 'system', content: 'You are a helpful programming assistant. Provide clear explanations, code suggestions, and step-by-step debugging help.' }
    ];

    if (context) messages.push({ role: 'system', content: context });

    if (code) {
      messages.push({ role: 'user', content: `Here is the user's code:\n\n${code}\n\n` });
    }

    messages.push({ role: 'user', content: prompt });

    const answer = await callOpenAI(messages, 1024);
    res.json({ answer });
  } catch (err) {
    console.error('Error /api/ask', err);
    res.status(500).json({ error: err.message });
  }
});

// === API: Run code (uses docker run) ===
app.post('/api/run', async (req, res) => {
  const { code, lang } = req.body;
  if (!code || !lang) return res.status(400).json({ error: 'missing fields' });

  const tmpDir = tmp.dirSync({ unsafeCleanup: true });
  try {
    let fileName, image, cmd;
    if (lang === 'python') {
      fileName = 'main.py';
      image = 'python:3.11-alpine';
      fs.writeFileSync(path.join(tmpDir.name, fileName), code);
      cmd = `docker run --rm -i -v ${tmpDir.name}:/work -w /work ${image} sh -c "python ${fileName}"`;
    } else if (lang === 'javascript') {
      fileName = 'main.js';
      image = 'node:20-alpine';
      fs.writeFileSync(path.join(tmpDir.name, fileName), code);
      cmd = `docker run --rm -i -v ${tmpDir.name}:/work -w /work ${image} sh -c "node ${fileName}"`;
    } else {
      tmpDir.removeCallback();
      return res.status(400).json({ error: 'lang not supported' });
    }

    exec(cmd, { timeout: 10000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      tmpDir.removeCallback();
      if (err) {
        return res.json({ output: (stderr || '') + '\n' + (err.message || '') });
      }
      res.json({ output: stdout || stderr || '(no output)' });
    });
  } catch (e) {
    tmpDir.removeCallback();
    res.status(500).json({ error: e.message });
  }
});

// === Serve frontend build if exists ===
const frontendPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
