import React from 'react';
import Editor from '@monaco-editor/react';

export default function EditorPane({ language, code, onChange }) {
  return (
    <Editor
      height="100%"
      language={language}
      value={code}
      onChange={(v) => onChange(v || '')}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
      }}
    />
  );
}
