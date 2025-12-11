
import React, { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import { Note, SearchResult } from '../types';
import { searchNotes } from '../services/db';
import { createRenderer } from '../services/markdown';

interface MarkdownEditorProps {
  note: Note | null;
  isOpen: boolean;
  initialMode: 'view' | 'edit';
  onClose: () => void;
  onSave: (id: string, content: string) => void;
  onInternalLinkClick: (title: string) => void;
}

// --- Helper: Caret Coordinates ---
// Creates a mirror div to calculate pixel position of the caret
const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
    const div = document.createElement('div');
    const style = window.getComputedStyle(element);
    
    Array.from(style).forEach((prop) => {
        div.style.setProperty(prop, style.getPropertyValue(prop));
    });

    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.top = '0';
    div.style.left = '0';
    
    // Copy content up to caret
    div.textContent = element.value.substring(0, position);
    
    // Create a span for the caret position
    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);

    document.body.appendChild(div);
    
    const coordinates = {
        top: span.offsetTop + parseInt(style.borderTopWidth),
        left: span.offsetLeft + parseInt(style.borderLeftWidth),
        height: parseInt(style.lineHeight)
    };

    document.body.removeChild(div);
    return coordinates;
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ note, isOpen, initialMode, onClose, onSave, onInternalLinkClick }) => {
  const [content, setContent] = useState('');
  const [parsedHtml, setParsedHtml] = useState('');
  const [isPreview, setIsPreview] = useState(initialMode === 'view');
  
  // Autocomplete State
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });
  const [triggerIndex, setTriggerIndex] = useState(-1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Use the shared renderer factory with clickable checkboxes for the editor
  const editorRenderer = useRef(createRenderer({ clickableCheckboxes: true })).current;

  // Initialize state when modal opens or note ID changes
  useEffect(() => {
    if (note && isOpen) {
      setContent(note.content || '');
      setIsPreview(initialMode === 'view');
      setShowSuggestions(false);
      
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

  // Search Notes for Autocomplete
  useEffect(() => {
    if (showSuggestions) {
        const fetch = async () => {
             // If query is empty, show recent/all, otherwise search
             const results = await searchNotes(suggestionQuery);
             setSuggestions(results);
             setSuggestionIndex(0);
        };
        const t = setTimeout(fetch, 150);
        return () => clearTimeout(t);
    }
  }, [suggestionQuery, showSuggestions]);

  const toggleTask = (index: number) => {
    if (!note) return;
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
      
      // Handle Checkboxes
      if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
           const checkboxes = previewRef.current?.querySelectorAll('input[type="checkbox"]');
           if (checkboxes) {
               const index = Array.from(checkboxes).indexOf(target as HTMLInputElement);
               if (index !== -1) {
                   toggleTask(index);
               }
           }
           return;
      }

      // Handle Internal Links
      if (target.classList.contains('internal-link')) {
          e.preventDefault();
          const title = target.getAttribute('data-title');
          if (title) {
              onInternalLinkClick(title);
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

  const insertSuggestion = (title: string) => {
      const before = content.slice(0, triggerIndex);
      const after = content.slice(textareaRef.current?.selectionEnd || content.length);
      
      const newText = `${before}[[${title}]]${after}`;
      setContent(newText);
      setShowSuggestions(false);
      
      // Reset focus and move cursor
      setTimeout(() => {
          if (textareaRef.current) {
              textareaRef.current.focus();
              const newCursorPos = triggerIndex + 2 + title.length + 2;
              textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
      }, 50);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setContent(val);

      // Autocomplete Logic
      const cursorPos = e.target.selectionEnd;
      // Look back for [[
      const lastOpenBracket = val.lastIndexOf('[[', cursorPos);
      
      if (lastOpenBracket !== -1) {
          const textBetween = val.slice(lastOpenBracket + 2, cursorPos);
          // If we encounter a newline or closing bracket, cancel autocomplete
          if (textBetween.includes(']]') || textBetween.includes('\n')) {
              setShowSuggestions(false);
          } else {
              // Valid trigger
              setTriggerIndex(lastOpenBracket);
              setSuggestionQuery(textBetween);
              setShowSuggestions(true);
              
              // Calculate Position
              const coords = getCaretCoordinates(e.target, lastOpenBracket);
              // Adjust for scroll
              const top = coords.top - e.target.scrollTop;
              const left = coords.left - e.target.scrollLeft;
              setCaretPos({ top, left });
          }
      } else {
          setShowSuggestions(false);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // Stop global listeners

    // Handle Autocomplete Navigation
    if (showSuggestions && suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSuggestionIndex(prev => (prev + 1) % suggestions.length);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
            return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            const selected = suggestions[suggestionIndex];
            if (selected) {
                insertSuggestion(selected.title);
            }
            return;
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            setShowSuggestions(false);
            return;
        }
    }

    // Standard Editor Keys
    
    // ESC - Close without saving (if not handling autocomplete)
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    
    // Ctrl+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (isPreview) {
            switchToEdit();
        } else {
            onClose();
        }
        return;
    }

    // Shift+Enter
    if (e.shiftKey && e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (isPreview) {
            onClose();
        } else {
             switchToView();
        }
        return;
    }
  };

  if (!isOpen || !note) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        ref={containerRef}
        tabIndex={-1} 
        onKeyDown={handleKeyDown}
        className="w-full max-w-[90vw] h-[90vh] bg-[var(--theme-bg)] rounded-lg shadow-2xl flex flex-col border border-gray-200 dark:border-gray-800 outline-none relative"
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
                    className="editor-preview w-full h-full p-6 overflow-auto prose dark:prose-invert max-w-none custom-scrollbar select-text outline-none compact-markdown"
                    dangerouslySetInnerHTML={{ __html: parsedHtml }}
                />
            ) : (
                <div className="relative w-full h-full">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleChange}
                        style={{ fontSize: '15px' }}
                        className="w-full h-full p-6 bg-transparent resize-none outline-none font-mono custom-scrollbar"
                        placeholder="Type markdown here... Use [[ to link."
                    />
                    
                    {/* Autocomplete Popup */}
                    {showSuggestions && (
                        <div 
                            className="absolute z-50 w-64 bg-card border border-gray-200 dark:border-gray-700 shadow-xl rounded-md max-h-60 overflow-y-auto"
                            style={{ 
                                top: caretPos.top + 30, // Offset a bit below line
                                left: caretPos.left + 24 // Offset a bit to right
                            }}
                        >
                            {suggestions.length === 0 ? (
                                <div className="p-2 text-xs text-gray-500 italic">No matching notes</div>
                            ) : (
                                suggestions.map((s, idx) => (
                                    <div
                                        key={s.id}
                                        onClick={() => insertSuggestion(s.title)}
                                        className={`px-3 py-2 text-sm cursor-pointer ${
                                            idx === suggestionIndex 
                                                ? 'bg-primary text-primary-foreground' 
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                    >
                                        {s.title}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
        <div className="p-2 text-xs text-gray-500 border-t dark:border-gray-700 text-center bg-background/50 rounded-b-lg">
            {isPreview 
                ? 'View Mode • Ctrl+Enter: Edit • Shift+Enter: Close • Esc: Close' 
                : 'Edit Mode • [[ for links • Shift+Enter: Save & View • Ctrl+Enter: Cancel & Close • Esc: Cancel'
            }
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;
