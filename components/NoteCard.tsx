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
    
    const hasContent = note.content && note.content.trim().length > 0;

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
              ${isFocused 
                  ? 'ring-2 ring-gray-100 dark:ring-zinc-950 text-primary bg-background/50 backdrop-blur-sm shadow-sm' 
                  : 'text-foreground'}
            `}
          >
            {note.title}
          </div>
          
          <div className="absolute top-2 right-2 flex items-center gap-2">
            {hasContent && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-orange-500">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            )}
            {note.isFavorite && (
                <div className="text-yellow-500 text-xl leading-none">★</div>
            )}
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
        style={{ fontSize: `${fontSize}px` }}
        className={`
          relative group flex items-center justify-between
          px-2 py-1 rounded-sm cursor-pointer select-none transition-all duration-150
          truncate flex-shrink-0
          ${
            isFocused
              ? 'ring-2 ring-gray-100 dark:ring-zinc-950 bg-background text-primary z-10'
              : 'bg-transparent text-foreground/90'
          }
          ${className || ''}
        `}
      >
        <span className="truncate flex-1">{note.title}</span>
        
        <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
            {hasContent && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-orange-500">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            )}
            {note.isFavorite && (
            <span className="text-yellow-500 text-xs leading-none">★</span>
            )}
        </div>
      </div>
    );
};

export default NoteCard;