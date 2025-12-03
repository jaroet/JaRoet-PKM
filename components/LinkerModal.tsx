import React, { useState, useEffect, useRef } from 'react';
import { SearchResult } from '../types';
import { searchNotes } from '../services/db';

interface LinkerModalProps {
  isOpen: boolean;
  type: 'up' | 'down' | 'left';
  onClose: () => void;
  onSelect: (targetId: string | null, newTitle?: string) => void;
}

const LinkerModal: React.FC<LinkerModalProps> = ({ isOpen, type, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetch = async () => {
      if (query.trim()) {
        const res = await searchNotes(query);
        setResults(res);
      } else {
        setResults([]);
      }
    };
    const debounce = setTimeout(fetch, 200);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (results.length + 1)); // +1 for "Create New"
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (results.length + 1)) % (results.length + 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < results.length) {
        // Existing note
        onSelect(results[selectedIndex].id);
      } else {
        // Create new
        if (query.trim()) {
          onSelect(null, query);
        }
      }
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const titles = {
    up: 'Link Parent (Upper)',
    down: 'Link Child (Downer)',
    left: 'Link Related (Lefter)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-background rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-4">
        <h3 className="text-lg font-semibold mb-2">{titles[type]}</h3>
        <input
          ref={inputRef}
          type="text"
          className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
          placeholder="Search or type to create..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="mt-2 max-h-60 overflow-y-auto border-t border-gray-100 dark:border-gray-800 pt-2">
          {results.map((res, idx) => (
            <div
              key={res.id}
              className={`p-2 rounded cursor-pointer ${
                idx === selectedIndex ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => {
                onSelect(res.id);
                onClose();
              }}
            >
              {res.title}
            </div>
          ))}
          {query.trim() && (
            <div
              className={`p-2 rounded cursor-pointer flex items-center gap-2 ${
                selectedIndex === results.length ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => {
                onSelect(null, query);
                onClose();
              }}
            >
              <span className="font-bold">+</span> Create "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LinkerModal;
