import React, { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import { Note } from '../types';

interface MarkdownEditorProps {
  note: Note | null;
  isOpen: boolean;
  initialMode: 'view' | 'edit';
  onClose: () => void;
  onSave: (id: string, content: string) => void;
}

// Define a specific renderer for the editor to ensure isolation from global defaults
const editorRenderer = new marked.Renderer();

// Link handling (same as global, opens in new tab)
editorRenderer.link = function(hrefOrObj: string | { href: string; title?: string; text: string }, title?: string | null, text?: string) {
    let href: string = '';
    let linkTitle: string | null | undefined = title;
    let linkText: string = text || '';

    if (typeof hrefOrObj === 'object') {
        href = hrefOrObj.href;
        linkTitle = hrefOrObj.title;
        linkText = hrefOrObj.text;
    } else {
        href = hrefOrObj;
    }

    const isExternal = href && (href.startsWith('http') || href.startsWith('//'));
    const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    const titleAttr = linkTitle ? ` title="${linkTitle}"` : '';
    
    let output = `<a href="${href}"${titleAttr}${targetAttr}>${linkText}`;
    
    if (isExternal) {
        output += '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block ml-0.5 opacity-70 mb-0.5 align-baseline"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';
    }
    
    output += '</a>';
    return output;
};

// Enabled checkboxes with styling for the editor
editorRenderer.checkbox = function(checked) {
    // added margin-right for spacing, vertical-align for alignment
    return `<input type="checkbox" ${checked ? 'checked="" ' : ''} class="task-list-item-checkbox" style="cursor: pointer; margin-right: 0.6em; vertical-align: middle;">`;
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ note, isOpen, initialMode, onClose, onSave }) => {
  const [content, setContent] = useState('');
  const [parsedHtml, setParsedHtml] = useState('');
  const [isPreview, setIsPreview] = useState(initialMode === 'view');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Initialize state when modal opens or note ID changes
  useEffect(() => {
    if (note && isOpen) {
      setContent(note.content || '');
      setIsPreview(initialMode === 'view');
      
      // Focus appropriate element
      setTimeout(() => {
          if (initialMode === 'view') {
              previewRef.current?.focus();
          } else {
              const el = textareaRef.current;
              if (el) {
                  el.focus();
                  // Move cursor to end
                  const len = el.value.length;
                  el.setSelectionRange(len, len);
                  el.scrollTop = el.scrollHeight;
              }
          }
      }, 100);
    }
  }, [note?.id, isOpen]); 

  // Parse markdown whenever content changes
  useEffect(() => {
    const parse = async () => {
        try {
            // Explicitly pass renderer to override any global config that disables checkboxes
            const html = await marked.parse(content || '', { 
                breaks: true, 
                gfm: true,
                renderer: editorRenderer 
            });
            setParsedHtml(html);
        } catch (e) {
            console.error('Markdown parse error:', e);
            setParsedHtml('<p>Error rendering markdown.</p>');
        }
    };
    const timeout = setTimeout(parse, 100);
    return () => clearTimeout(timeout);
  }, [content]);

  const toggleTask = (index: number) => {
    if (!note) return;
    // Regex to find tasks: matches "- [ ]", "* [x]", etc.
    const regex = /^(\s*[-*+]\s+\[)([ xX])(\])/gm;
    let currentIndex = 0;
    
    const newContent = content.replace(regex, (match, prefix, state, suffix) => {
        if (currentIndex === index) {
            const newState = state === ' ' ? 'x' : ' ';
            currentIndex++; 
            return `${prefix}${newState}${suffix}`;
        }
        currentIndex++;
        return match;
    });

    if (newContent !== content) {
        setContent(newContent);
        onSave(note.id, newContent);
    }
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
           const checkboxes = previewRef.current?.querySelectorAll('input[type="checkbox"]');
           if (checkboxes) {
               const index = Array.from(checkboxes).indexOf(target as HTMLInputElement);
               if (index !== -1) {
                   toggleTask(index);
               }
           }
      }
  };

  const switchToEdit = () => {
      setIsPreview(false);
      setTimeout(() => {
          const el = textareaRef.current;
          if (el) {
              el.focus();
              const len = el.value.length;
              el.setSelectionRange(len, len);
              el.scrollTop = el.scrollHeight;
          }
      }, 50);
  };

  const switchToView = () => {
      if (note) onSave(note.id, content);
      setIsPreview(true);
      setTimeout(() => previewRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // Stop global listeners

    // ESC - Close without saving
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    
    // Ctrl+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (isPreview) {
            // If in View Mode -> Switch to Edit Mode
            switchToEdit();
        } else {
            // If in Edit Mode -> Close without saving (Cancel/Esc)
            onClose();
        }
        return;
    }

    // Shift+Enter
    if (e.shiftKey && e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (isPreview) {
            // If in View Mode -> Close
            onClose();
        } else {
             // If in Edit Mode -> Save & Switch to View Mode
             switchToView();
        }
        return;
    }
  };

  if (!isOpen || !note) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
       {/* CSS override for compact lists in this specific editor instance */}
      <style>{`
        .editor-preview ul, .editor-preview ol {
            margin-top: 0.25em !important;
            margin-bottom: 0.25em !important;
        }
        .editor-preview li {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
        }
        .editor-preview li > p {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
        }
        .editor-preview li.task-list-item {
            list-style-type: none;
            padding-left: 0;
        }
      `}</style>

      <div 
        ref={containerRef}
        tabIndex={-1} 
        onKeyDown={handleKeyDown}
        className="w-full max-w-[90vw] h-[90vh] bg-[var(--theme-bg)] rounded-lg shadow-2xl flex flex-col border border-gray-200 dark:border-gray-800 outline-none"
      >
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 bg-background/50 rounded-t-lg">
          <h2 className="text-xl font-bold truncate pr-4">{note.title}</h2>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => isPreview ? switchToEdit() : switchToView()}
              title={isPreview ? "Switch to Edit (Ctrl+Enter)" : "Switch to View (Shift+Enter)"}
              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:opacity-80 text-sm min-w-[80px]"
            >
              {isPreview ? 'Edit' : 'Preview'}
            </button>
            {!isPreview && (
                <button
                onClick={() => {
                    onSave(note.id, content);
                    onClose();
                }}
                className="px-3 py-1 rounded bg-primary text-white hover:opacity-80 text-sm"
                >
                Save & Close
                </button>
            )}
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
                    onClick={handlePreviewClick}
                    style={{ fontSize: '15px' }}
                    className="editor-preview w-full h-full p-6 overflow-auto prose dark:prose-invert max-w-none custom-scrollbar select-text outline-none"
                    dangerouslySetInnerHTML={{ __html: parsedHtml }}
                />
            ) : (
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={{ fontSize: '15px' }}
                    className="w-full h-full p-6 bg-transparent resize-none outline-none font-mono custom-scrollbar"
                    placeholder="Type markdown here..."
                />
            )}
        </div>
        <div className="p-2 text-xs text-gray-500 border-t dark:border-gray-700 text-center bg-background/50 rounded-b-lg">
            {isPreview 
                ? 'View Mode • Ctrl+Enter: Edit • Shift+Enter: Close • Esc: Close' 
                : 'Edit Mode • Shift+Enter: Save & View • Ctrl+Enter: Cancel & Close • Esc: Cancel & Close'
            }
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;