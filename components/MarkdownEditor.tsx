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
  const [isPreview, setIsPreview] = useState(true); // Default
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Initialize state when modal opens
  useEffect(() => {
    if (note && isOpen) {
      const hasContent = note.content && note.content.trim().length > 0;
      setContent(note.content || '');
      
      // Show preview if content exists, otherwise edit mode
      setIsPreview(hasContent);
      
      // Focus appropriate element
      setTimeout(() => {
          if (hasContent) {
              previewRef.current?.focus();
          } else {
              textareaRef.current?.focus();
          }
      }, 100);
    }
  }, [note, isOpen]);

  // Parse markdown whenever content changes
  useEffect(() => {
    const parse = async () => {
        try {
            const renderer = new marked.Renderer();
            renderer.link = (href, title, text) => {
                return `<a target="_blank" rel="noopener noreferrer" href="${href}" title="${title || ''}">${text}</a>`;
            };
            const html = await marked.parse(content || '', { renderer, breaks: true, gfm: true });
            setParsedHtml(html);
        } catch (e) {
            console.error('Markdown parse error:', e);
            setParsedHtml('<p>Error rendering markdown.</p>');
        }
    };
    const timeout = setTimeout(parse, 100);
    return () => clearTimeout(timeout);
  }, [content]);

  const handleToggleMode = () => {
      if (isPreview) {
          // Switch to Edit Mode
          setIsPreview(false);
          setTimeout(() => textareaRef.current?.focus(), 50);
      } else {
          // Switch to View Mode -> Save Content
          if (note) onSave(note.id, content);
          setIsPreview(true);
          setTimeout(() => previewRef.current?.focus(), 50);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // ESC - Close without saving
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    
    // Ctrl+E / Cmd+E - Toggle Mode
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleToggleMode();
        return;
    }

    // Ctrl+Enter - Save and Close
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (note) onSave(note.id, content);
        onClose();
    }
  };

  if (!isOpen || !note) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        ref={containerRef}
        // Use -1 so it doesn't trap tab focus but can catch bubbles
        tabIndex={-1} 
        onKeyDown={handleKeyDown}
        className="w-full max-w-[90vw] h-[90vh] bg-[var(--theme-bg)] rounded-lg shadow-2xl flex flex-col border border-gray-200 dark:border-gray-800 outline-none"
      >
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 bg-background/50 rounded-t-lg">
          <h2 className="text-xl font-bold truncate pr-4">{note.title}</h2>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleToggleMode}
              title="Ctrl+E"
              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:opacity-80 text-sm min-w-[80px]"
            >
              {isPreview ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={() => {
                onSave(note.id, content);
                onClose();
              }}
              title="Ctrl+Enter"
              className="px-3 py-1 rounded bg-primary text-white hover:opacity-80 text-sm"
            >
              Save & Close
            </button>
             <button
              onClick={onClose}
              title="Esc"
              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:opacity-80 text-sm"
            >
              Close
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden relative bg-background/50">
            {isPreview ? (
                <div 
                    ref={previewRef}
                    tabIndex={0}
                    className="w-full h-full p-6 overflow-auto prose dark:prose-invert max-w-none custom-scrollbar select-text outline-none"
                    dangerouslySetInnerHTML={{ __html: parsedHtml }}
                />
            ) : (
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-full p-6 bg-transparent resize-none outline-none font-mono text-base custom-scrollbar"
                    placeholder="Type markdown here..."
                />
            )}
        </div>
        <div className="p-2 text-xs text-gray-500 border-t dark:border-gray-700 text-center bg-background/50 rounded-b-lg">
            {isPreview 
                ? 'View Mode • Ctrl+E to Edit • Esc to Close' 
                : 'Edit Mode • Ctrl+E to Save & Preview • Ctrl+Enter to Save & Close • Esc to Cancel'
            }
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;