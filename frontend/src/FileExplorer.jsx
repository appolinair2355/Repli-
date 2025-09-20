import React, { useState } from 'react';

export default function FileExplorer({ files, setFiles, setActiveFile, activeFile }) {
  const [newName, setNewName] = useState('');

  function addFile() {
    if (!newName) return;
    setFiles((f) => ({ ...f, [newName]: '' }));
    setActiveFile(newName);
    setNewName('');
  }

  function deleteFile(name) {
    const copy = { ...files };
    delete copy[name];
    setFiles(copy);
    const keys = Object.keys(copy);
    setActiveFile(keys.length ? keys[0] : null);
  }

  return (
    <div>
      <h4>Files</h4>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {Object.keys(files).map((name) => (
          <li key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <button onClick={() => setActiveFile(name)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              {name} {activeFile === name ? '•' : ''}
            </button>
            <button onClick={() => deleteFile(name)} style={{ color: 'red' }}>x</button>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 12 }}>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="new-file.py" />
        <button onClick={addFile} style={{ marginLeft: 6 }}>Add</button>
      </div>
    </div>
  );
}
