import React, { useState } from 'react';
import FileExplorer from './FileExplorer';
import EditorPane from './EditorPane';
import ConsolePane from './ConsolePane';
import ChatAI from './ChatAI';

export default function App() {
  const [files, setFiles] = useState({
    'main.py': 'print("Hello from Python")'
  });
  const [activeFile, setActiveFile] = useState('main.py');
  const [output, setOutput] = useState('');
  const [lang, setLang] = useState('python');

  function updateFile(filename, content) {
    setFiles((f) => ({ ...f, [filename]: content }));
  }

  async function runCode() {
    setOutput('Executing...');
    const code = files[activeFile] || '';
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, lang })
      });
      const data = await res.json();
      setOutput(data.output || JSON.stringify(data));
    } catch (e) {
      setOutput('Network error: ' + e.message);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 360px', gridTemplateRows: '1fr 240px', height: '100vh' }}>
      <div style={{ gridRow: '1 / span 2', borderRight: '1px solid #ddd', padding: 8 }}>
        <FileExplorer files={files} setFiles={setFiles} setActiveFile={setActiveFile} activeFile={activeFile} />
      </div>

      <div style={{ padding: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="python">Python</option>
            <option value="javascript">JavaScript (Node)</option>
          </select>
          <button onClick={runCode} style={{ marginLeft: 8 }}>Run</button>
        </div>

        <div style={{ height: 'calc(100vh - 150px)', border: '1px solid #eee' }}>
          <EditorPane
            language={lang}
            code={files[activeFile]}
            onChange={(c) => updateFile(activeFile, c)}
          />
        </div>
      </div>

      <div style={{ borderLeft: '1px solid #ddd', padding: 8 }}>
        <ChatAI
          getCode={() => files[activeFile]}
          onInsert={(newCode) => updateFile(activeFile, newCode)}
        />
      </div>

      <div style={{ gridColumn: '1 / span 3', borderTop: '1px solid #ddd' }}>
        <ConsolePane output={output} />
      </div>
    </div>
  );
}
