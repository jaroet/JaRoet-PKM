
(function(J) {
    const { Icons } = J;
    J.NoteCard = ({ note, isFocused, isSelected, isCenter, fontSize, onClick, className, id, subtitle }) => {
        // Central Note Style
        if (isCenter) {
            return html`
                <div
                    id=${id}
                    onClick=${onClick}
                    className=${`relative flex flex-col items-center justify-center transition-all duration-200 cursor-pointer z-20 p-6 max-w-3xl text-center ${className || ''}`}
                >
                    <div 
                        style=${{ 
                            fontSize: `${fontSize * 1.5}px`,
                            backgroundColor: isFocused ? 'color-mix(in srgb, var(--primary) 20%, transparent)' : undefined,
                            boxShadow: isFocused ? '0 0 0 2px color-mix(in srgb, var(--primary) 50%, transparent)' : undefined
                        }}
                        className=${`font-bold leading-tight select-none px-4 py-2 rounded-lg transition-all text-foreground ${isFocused ? 'backdrop-blur-sm shadow-sm' : ''}`}
                    >
                        ${note.title}
                    </div>
                    ${subtitle && html`
                        <div 
                            style=${{ fontSize: `${fontSize * 0.9}px` }}
                            className="mt-2 font-medium opacity-60 uppercase tracking-widest"
                        >
                            ${subtitle}
                        </div>
                    `}
                </div>
            `;
        }

        // List Item Style
        return html`
            <div
                id=${id}
                onClick=${onClick}
                title=${note.title}
                style=${{ 
                    fontSize: `${fontSize}px`,
                    backgroundColor: isFocused 
                        ? 'color-mix(in srgb, var(--primary) 20%, transparent)' 
                        : isSelected 
                            ? 'color-mix(in srgb, var(--primary) 10%, transparent)'
                            : undefined,
                    boxShadow: isFocused 
                        ? 'inset 0 0 0 2px color-mix(in srgb, var(--primary) 50%, transparent)' 
                        : isSelected
                            ? 'inset 0 0 0 2px color-mix(in srgb, var(--primary) 30%, transparent)'
                            : undefined
                }}
                className=${`relative group flex items-center px-3 py-1 rounded-md cursor-pointer select-none transition-all duration-150 truncate flex-shrink-0 text-foreground ${isFocused ? 'z-10 shadow-sm font-medium' : 'hover:bg-foreground/5 opacity-90 hover:opacity-100'} ${className || ''}`}
            >
                <span className="truncate flex-1">${note.title}</span>
                ${isSelected && html`
                    <span className="absolute right-2 w-2 h-2 rounded-full bg-primary"></span>
                `}
            </div>
        `;
    };
})(window.Jaroet);
