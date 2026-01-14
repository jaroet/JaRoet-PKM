(function(J) {
    const { useState, useEffect, useRef } = React;
    const { DB } = J.Services;
    const { useListNavigation } = J.Hooks;

    function MentionsList({ activeNote, onNoteClick, nav, isVisible, ...sp }) {
        const [mentions, setMentions] = useState([]);
        const [isLoading, setIsLoading] = useState(true);

        useEffect(() => {
            if (!activeNote || !isVisible) {
                setMentions([]);
                return;
            }

            let isMounted = true;
            setIsLoading(true);

            const fetchMentions = async () => {
                // Fetch notes that have the active note in their `outgoingLinks`
                const linkedMentions = await DB.db.notes.where('outgoingLinks').equals(activeNote.id).toArray();

                if (isMounted) {
                    setMentions(linkedMentions);
                    setIsLoading(false);
                }
            };

            fetchMentions();

            return () => { isMounted = false; };
        }, [activeNote, isVisible]);

        const handleEnter = (index) => {
            if (mentions[index]) {
                nav(mentions[index].id);
            }
        };

        const { activeIndex, listRef, handleKeyDown } = useListNavigation({
            isOpen: isVisible,
            itemCount: mentions.length,
            onEnter: handleEnter,
            onEscape: () => {},
        });

        if (isLoading) {
            return html`<div className="p-4 text-center text-sm text-gray-400">Loading mentions...</div>`;
        }

        return html`
            <div 
                className="note-list-container flex-1 overflow-y-auto p-3 custom-scrollbar"
                onKeyDown=${handleKeyDown}
                tabIndex="-1" 
            >
                <div ref=${listRef} className="note-list flex flex-col gap-0">
                    ${mentions.length > 0 ? mentions.map((note, index) =>
                        html`<${J.NoteCard} key=${note.id} id=${`note-mentions-${index}`} note=${note} onClick=${(e) => onNoteClick(note.id, e.ctrlKey)} isFocused=${activeIndex === index} fontSize=${sp.fontSize} isSelected=${sp.selectedNoteIds.has(note.id)} className="w-full" />`
                    ) : html`<div className="p-4 text-center text-sm text-gray-400 col-span-full">No mentions found.</div>`}
                </div>
            </div>
        `;
    }

    J.Components.MentionsList = MentionsList;

})(window.Jaroet);