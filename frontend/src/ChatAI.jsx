import React, { useState } from 'react';

export default function ChatAI({ getCode, onInsert }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function send() {
    const userMsg = input;
    if (!userMsg) return;
    const code = getCode();
    const newMsg = { role: 'user', content: userMsg };
    setMessages((m) => [...m, newMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg, code })
      });
      const data = await res.json();
      const botMsg = { role: 'assistant', content: data.answer || JSON.stringify(data) };
      setMessages((m) => [...m, botMsg]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Network error: ' + e.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h4>Ask AI</h4>
      <div style={{ flex: 1, overflow: 'auto', border: '1px solid #eee', padding: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: '#666' }}>{m.role}</div>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{m.content}</pre>
            {m.role === 'assistant' && (
              <button onClick={() => onInsert(m.content)} style={{ marginTop: 6 }}>Insert suggestion into file</button>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 8 }}>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={3} style={{ width: '100%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <button onClick={send} disabled={loading}>{loading ? 'Thinking...' : 'Ask'}</button>
          <small style={{ color: '#666' }}>AI model used: server-side (OPENAI)</small>
        </div>
      </div>
    </div>
  );
}
