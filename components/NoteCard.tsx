import React from 'react';
import { Note } from '../types';

interface NoteCardProps {
  note: Note;
  isFocused: boolean;
  isSelected?: boolean;
  isCenter?: boolean;
  fontSize: number;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  id?: string;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, isFocused, isSelected, isCenter, fontSize, onClick, className, id }) => {
    
    // Central Note Style
    if (isCenter) {
      return (
        <div
          id={id}
          onClick={onClick}
          className={`
            relative flex flex-col items-center justify-center transition-all duration-200 cursor-pointer z-20
            p-6 max-w-3xl text-center
            ${className || ''}
          `}
        >
          <div 
            style={{ 
                fontSize: `${fontSize * 1.5}px`,
                backgroundColor: isFocused ? 'color-mix(in srgb, var(--theme-accent) 20%, transparent)' : undefined,
                boxShadow: isFocused ? '0 0 0 2px color-mix(in srgb, var(--theme-accent) 50%, transparent)' : undefined
            }}
            className={`
              font-bold leading-tight select-none px-4 py-2 rounded-lg transition-all
              ${isFocused ? 'backdrop-blur-sm shadow-sm' : ''}
              text-foreground
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
            backgroundColor: isFocused 
                ? 'color-mix(in srgb, var(--theme-accent) 20%, transparent)' 
                : isSelected 
                    ? 'color-mix(in srgb, var(--theme-accent) 10%, transparent)'
                    : undefined,
            boxShadow: isFocused 
                ? 'inset 0 0 0 2px color-mix(in srgb, var(--theme-accent) 50%, transparent)' 
                : isSelected
                    ? 'inset 0 0 0 2px color-mix(in srgb, var(--theme-accent) 30%, transparent)'
                    : undefined
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
        {isSelected && (
            <span className="absolute right-2 w-2 h-2 rounded-full bg-[var(--theme-accent)]"></span>
        )}
      </div>
    );
};

export default NoteCard;