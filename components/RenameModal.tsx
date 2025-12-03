import React, { useState, useEffect, useRef } from 'react';

interface RenameModalProps {
  isOpen: boolean;
  currentTitle: string;
  onClose: () => void;
  onRename: (newTitle: string) => void;
}

const RenameModal: React.FC<RenameModalProps> = ({ isOpen, currentTitle, onClose, onRename }) => {
  const [title, setTitle] = useState(currentTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, currentTitle]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (title.trim()) {
      onRename(title.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background p-6 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Rename Note</h3>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-transparent focus:ring-2 focus:ring-primary outline-none mb-4 text-foreground"
            placeholder="Note title..."
          />
          <div className="flex justify-end gap-2">
            <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                Cancel
            </button>
            <button 
                type="submit" 
                className="px-4 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
                Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameModal;