import React, { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import { Note } from '../types';

interface MarkdownEditorProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, content: string) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ note, isOpen, onClose, onSave }) => {
  const [content, setContent] = useState('');
  const [parsedHtml, setParsedHtml] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (note && isOpen) {
      setContent(note.content || '');
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [note, isOpen]);

  useEffect(() => {
    const parse = async () => {
        try {
            // Ensure we handle potential async return from marked
            const html = await marked.parse(content || '', { breaks: true, gfm: true });
            setParsedHtml(html);
        } catch (e) {
            console.error('Markdown parse error:', e);
            setParsedHtml('<p>Error rendering markdown.</p>');
        }
    };
    const timeout = setTimeout(parse, 100);
    return () => clearTimeout(timeout);
  }, [content]);

  if (!isOpen || !note) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    // Ctrl+Enter to save and close
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        onSave(note.id, content);
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl h-[80vh] bg-background rounded-lg shadow-2xl flex flex-col border border-gray-200 dark:border-gray-800">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold">{note.title}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:opacity-80 text-sm"
            >
              {isPreview ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={() => {
                onSave(note.id, content);
                onClose();
              }}
              className="px-3 py-1 rounded bg-primary text-white hover:opacity-80 text-sm"
            >
              Save
            </button>
             <button
              onClick={onClose}
              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:opacity-80 text-sm"
            >
              Close
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
            {isPreview ? (
                <div 
                    className="w-full h-full p-6 overflow-auto prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: parsedHtml }}
                />
            ) : (
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full h-full p-6 bg-transparent resize-none outline-none font-mono text-base"
                    placeholder="Type markdown here..."
                />
            )}
        </div>
        <div className="p-2 text-xs text-gray-500 border-t dark:border-gray-700 text-center">
            Markdown Supported • Ctrl+Enter to Save • Esc to Cancel
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;