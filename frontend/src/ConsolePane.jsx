import React from 'react';

export default function ConsolePane({ output }) {
  return (
    <div style={{ background: '#111', color: '#eee', padding: 12, height: '240px', overflow: 'auto', fontFamily: 'monospace' }}>
      <strong>Console</strong>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{output}</pre>
    </div>
  );
}
