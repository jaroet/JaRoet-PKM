import React from 'react';
import { Note } from '../types';

interface NoteCardProps {
  note: Note;
  isFocused: boolean;
  isCenter?: boolean;
  fontSize: number;
  onClick: () => void;
  className?: string;
  id?: string;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, isFocused, isCenter, fontSize, onClick, className, id }) => {
    
    // Central Note Style
    if (isCenter) {
      return (
        <div
          id={id}
          onClick={onClick}
          className={`
            relative flex flex-col items-center justify-center transition-all duration-200 cursor-pointer z-20
            p-6 max-w-3xl text-center text-foreground
            ${className || ''}
          `}
        >
          <div 
            style={{ 
                fontSize: `${fontSize * 1.5}px`,
                backgroundColor: isFocused ? 'color-mix(in srgb, var(--theme-accent) 20%, transparent)' : undefined,
                boxShadow: isFocused ? '0 0 0 2px var(--theme-accent)' : undefined
            }}
            className={`
              font-bold leading-tight select-none px-4 py-2 rounded-lg transition-all
              ${isFocused ? 'backdrop-blur-sm shadow-sm' : ''}
            `}
          >
            {note.title}
          </div>
        </div>
      );
    }

    // List Item Style (Uppers, Downers, Lefters, Righters)
    return (
      <div
        id={id}
        onClick={onClick}
        title={note.title}
        style={{ 
            fontSize: `${fontSize}px`,
            backgroundColor: isFocused ? 'color-mix(in srgb, var(--theme-accent) 20%, transparent)' : undefined,
            boxShadow: isFocused ? 'inset 0 0 0 1px var(--theme-accent)' : undefined
        }}
        className={`
          relative group flex items-center
          px-3 py-1.5 rounded-md cursor-pointer select-none transition-all duration-150
          truncate flex-shrink-0 text-foreground
          ${
            isFocused
              ? 'z-10 shadow-sm font-medium'
              : 'hover:bg-foreground/5 opacity-90 hover:opacity-100'
          }
          ${className || ''}
        `}
      >
        <span className="truncate flex-1">{note.title}</span>
      </div>
    );
};

export default NoteCard;