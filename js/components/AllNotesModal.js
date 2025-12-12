
(function(J) {
    const { useState, useEffect } = React;
    const { getAllNotesSortedBy } = J.Services.DB;

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const YYYY = date.getFullYear();
        const MM = String(date.getMonth() + 1).padStart(2, '0');
        const DD = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        
        return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
    };

    J.AllNotesModal = ({ isOpen, onClose, onSelect }) => {
        const [notes, setNotes] = useState([]);
        const [sortBy, setSortBy] = useState('modifiedAt'); // 'modifiedAt' or 'createdAt'

        useEffect(() => {
            if (isOpen) {
                getAllNotesSortedBy(sortBy).then(setNotes);
            }
        }, [isOpen, sortBy]);

        if (!isOpen) return null;

        const SortButton = ({ field, children }) => html`
            <button 
                onClick=${() => setSortBy(field)}
                className=${`flex-1 py-1 text-sm font-medium rounded-md transition-all ${sortBy === field ? 'bg-primary text-primary-foreground shadow-sm' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/10'}`}
            >${children}</button>
        `;

        return html`
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick=${onClose}>
                <div className="w-full max-w-2xl h-[80vh] bg-card rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col text-foreground" onClick=${e => e.stopPropagation()}>
                    <div className="p-4 border-b dark:border-gray-700">
                        <h2 className="text-lg font-bold text-center mb-3">All Notes</h2>
                        <div className="flex justify-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-sm mx-auto">
                            <${SortButton} field="modifiedAt">Last Modified<//>
                            <${SortButton} field="createdAt">Created<//>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        ${notes.map(note => html`
                            <div key=${note.id} onClick=${() => onSelect(note.id)} className="flex justify-between items-center px-4 py-1.5 border-b border-gray-100 dark:border-gray-800 hover:bg-primary/10 cursor-pointer">
                                <span className="font-medium truncate pr-4">${note.title}</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400 flex-shrink-0 font-mono">${formatDate(note[sortBy])}</span>
                            </div>
                        `)}
                    </div>
                </div>
            </div>
        `;
    };
})(window.Jaroet);