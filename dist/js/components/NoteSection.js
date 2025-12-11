
(function(J) {
    const { useLayoutEffect } = React;

    J.NoteSection = ({notes,section,containerClasses,itemClasses,containerId,fontSize,focusedSection,focusedIndex,selectedNoteIds,onNoteClick,scrollPositionsRef}) => {
        const { NoteCard } = J;
        const sorted=[...notes].sort((a,b)=>a.title.localeCompare(b.title));
        
        // Restore scroll position when list content changes
        useLayoutEffect(()=>{
            const el=document.getElementById(containerId);
            if(el) el.scrollTop = scrollPositionsRef.current[containerId]||0;
        },[sorted.map(n=>n.id).join(','), section]);

        return html`
            <div 
                id=${containerId} 
                className=${containerClasses} 
                onScroll=${e=>scrollPositionsRef.current[containerId]=e.target.scrollTop}
            >
                ${sorted.map((n,i)=>html`
                    <${NoteCard} 
                        key=${n.id} 
                        id=${`note-${section}-${i}`} 
                        note=${n} 
                        fontSize=${fontSize} 
                        isFocused=${focusedSection===section&&focusedIndex===i} 
                        isSelected=${selectedNoteIds.has(n.id)} 
                        onClick=${e=>onNoteClick(n.id,e.ctrlKey)} 
                        className=${itemClasses} 
                    />
                `)}
            </div>
        `;
    };
})(window.Jaroet);
