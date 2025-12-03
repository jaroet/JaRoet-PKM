
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
            p-6 max-w-3xl text-center
            ${className || ''}
          `}
        >
          <div 
            style={{ fontSize: `${fontSize * 1.5}px` }}
            className={`
              font-bold leading-tight select-none px-4 py-2 rounded-lg transition-all
              ${isFocused ? 'ring-2 ring-primary text-primary bg-background/50 backdrop-blur-sm shadow-md' : 'text-foreground'}
            `}
          >
            {note.title}
          </div>
          {note.isFavorite && (
            <div className="absolute top-2 right-2 text-yellow-500 text-xl">★</div>
          )}
        </div>
      );
    }

    // List Item Style (Uppers, Downers, Lefters, Righters)
    return (
      <div
        id={id}
        onClick={onClick}
        title={note.title}
        style={{ fontSize: `${fontSize}px` }}
        className={`
          relative group flex items-center justify-between
          px-2 py-1 rounded-sm cursor-pointer select-none transition-all duration-150
          truncate flex-shrink-0
          ${
            isFocused
              ? 'ring-1 ring-primary bg-background text-primary z-10'
              : 'bg-transparent text-foreground/90'
          }
          ${className || ''}
        `}
      >
        <span className="truncate">{note.title}</span>
        
        {note.isFavorite && (
          <span className="ml-2 text-yellow-500 text-xs flex-shrink-0">★</span>
        )}
      </div>
    );
};

export default NoteCard;