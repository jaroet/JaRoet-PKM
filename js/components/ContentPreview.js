(function(J) {
    const { findNoteByTitle } = J.Services.DB;

    function ContentPreview({ isFocused, fontSize, previewHtml, onNavigate, onFocus }) {

        const handleClick = async (e) => {
            if (e.target.classList.contains('internal-link') && e.target.dataset.title) {
                e.preventDefault();
                const noteToNav = await findNoteByTitle(e.target.dataset.title);
                if (noteToNav) onNavigate(noteToNav.id);
            }
        };

        return html`
            <${J.Components.SectionContainer} 
                title="Content" 
                className=${`flex-1 outline-none ${isFocused ? 'ring-2 ring-primary' : ''}`} 
                onClick=${onFocus}
            >
                <div 
                    className="absolute inset-0 p-6 overflow-auto custom-scrollbar prose dark:prose-invert max-w-none rounded-b-3xl compact-markdown" 
                    onClick=${handleClick} 
                    dangerouslySetInnerHTML=${{ __html: previewHtml }} />
            </${J.Components.SectionContainer}>
        `;
    }

    J.Components.ContentPreview = ContentPreview;
})(window.Jaroet);