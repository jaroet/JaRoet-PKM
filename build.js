
const fs = require('fs');
const path = require('path');

// Configuration
const ORDER = [
  'types.ts', // Types (will be stripped)
  'services/dateUtils.ts',
  'services/markdown.ts',
  'services/db.ts',
  'services/journal.ts',
  'hooks/useHistory.ts',
  'components/NoteCard.tsx',
  'components/LinkerModal.tsx',
  'components/RenameModal.tsx',
  'components/CalendarDropdown.tsx',
  'components/SettingsModal.tsx',
  'components/ImportModal.tsx',
  'components/MarkdownEditor.tsx',
  'App.tsx'
];

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>JaRoet PKM</title>
    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
    <script>
      tailwind.config = { darkMode: 'class', theme: { extend: { colors: { background: 'var(--background)', foreground: 'var(--foreground)', card: 'var(--card)', 'card-foreground': 'var(--card-foreground)', primary: 'var(--primary)', 'primary-foreground': 'var(--primary-foreground)' } } } }
    </script>
    <style>
      :root { --background: #f8fafc; --foreground: #0f172a; --card: #ffffff; --card-foreground: #0f172a; --primary: #3b82f6; --primary-foreground: #ffffff; --scrollbar-thumb: #94a3b8; }
      .dark { --background: #0f172a; --foreground: #f8fafc; --card: #1e293b; --card-foreground: #f8fafc; --primary: #60a5fa; --primary-foreground: #0f172a; --scrollbar-thumb: #475569; }
      body { background-color: var(--background); color: var(--foreground); transition: background-color 0.3s, color 0.3s; }
      .custom-scrollbar { scrollbar-width: thin; scrollbar-color: var(--scrollbar-thumb) transparent; }
      .custom-scrollbar::-webkit-scrollbar { width: 12px; height: 12px; display: block; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background-color: var(--scrollbar-thumb); border-radius: 6px; border: 3px solid transparent; background-clip: content-box; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: var(--primary); }
      .compact-markdown ul, .compact-markdown ol { margin-top: 0.25em !important; margin-bottom: 0.25em !important; }
      .compact-markdown li { margin-top: 0 !important; margin-bottom: 0 !important; }
      .compact-markdown li > p { margin-top: 0 !important; margin-bottom: 0 !important; }
      .compact-markdown li.task-list-item { list-style-type: none; padding-left: 0; }
    </style>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/dexie@3.2.4/dist/dexie.min.js"></script>
    <script src="https://unpkg.com/marked@9.1.2/marked.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        // --- Globals ---
        const { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo } = React;
        if(typeof crypto==='undefined')window.crypto={};
        if(!window.crypto.randomUUID){window.crypto.randomUUID=function(){return'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0,v=c=='x'?r:(r&0x3|0x8);return v.toString(16)})}};

        // --- BUNDLED APP CODE ---
        /*_APP_CODE_*/

        // --- RENDER ---
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>`;

function stripTypes(code) {
    // Very basic stripper, removes lines starting with "import", "export"
    // In a real scenario, use babel/typescript compiler
    let lines = code.split('\n');
    lines = lines.filter(l => !l.trim().startsWith('import ') && !l.trim().startsWith('export interface') && !l.trim().startsWith('export type'));
    return lines.map(l => l.replace('export const', 'const').replace('export class', 'class').replace('export function', 'function').replace('export default', '')).join('\n');
}

let bundledCode = '';

ORDER.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`Bundling ${file}...`);
        const content = fs.readFileSync(file, 'utf8');
        bundledCode += `\n/* --- ${file} --- */\n` + stripTypes(content);
    } else {
        console.warn(`Warning: File ${file} not found.`);
    }
});

const finalHtml = HTML_TEMPLATE.replace('/*_APP_CODE_*/', bundledCode);
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);
fs.writeFileSync(path.join(distDir, 'index.html'), finalHtml);
console.log('Build complete: dist/index.html');
