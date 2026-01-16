(function(J) {
    const { useState, useEffect, useRef, useMemo } = React;
    const { searchContent } = J.Services.DB;

    J.ContentSearchModal = ({ isOpen, onClose, onNavigate, initialQuery, initialResults, onStateChange }) => {
        const [query, setQuery] = useState(initialQuery || '');
        const [results, setResults] = useState(initialResults || []);
        const [isSearching, setIsSearching] = useState(false);
        const [sortConfig, setSortConfig] = useState({ key: 'count', direction: 'desc' });
        const inputRef = useRef(null);

        useEffect(() => {
            if (isOpen) {
                setTimeout(() => inputRef.current?.focus(), 50);
            }
        }, [isOpen]);

        const handleSearch = async (e) => {
            e?.preventDefault();
            if (!query.trim()) return;
            
            setIsSearching(true);
            // Small timeout to allow UI to show "Searching..." state before blocking thread
            setTimeout(async () => {
                const res = await searchContent(query);
                setResults(res);
                onStateChange(query, res); // Persist state to parent
                setIsSearching(false);
            }, 10);
        };

        // Highlight the search term in the snippet
        const highlight = (text, term) => {
            if (!term) return text;
            const parts = text.split(new RegExp(`(${term})`, 'gi'));
            return parts.map((part, i) => 
                part.toLowerCase() === term.toLowerCase() 
                    ? html`<span key=${i} className="bg-yellow-200 dark:bg-yellow-900 text-black dark:text-white font-bold px-0.5 rounded-sm">${part}</span>` 
                    : part
            );
        };

        const handleSort = (key) => {
            setSortConfig(current => ({
                key,
                direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
            }));
        };

        const sortedResults = useMemo(() => {
            const sorted = [...results];
            sorted.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];
                
                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();
                if (aVal === undefined) aVal = 0;
                if (bVal === undefined) bVal = 0;

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
            return sorted;
        }, [results, sortConfig]);

        const formatDate = (ts) => {
            if (!ts) return '-';
            return new Date(ts).toLocaleDateString();
        };

        if (!isOpen) return null;

        return html`
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick=${onClose}>
                <div className="w-full max-w-4xl h-[80vh] bg-card rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col text-foreground" onClick=${e => e.stopPropagation()}>
                    <div className="p-4 border-b dark:border-gray-700 flex gap-2">
                        <form onSubmit=${handleSearch} className="flex-1 flex gap-2">
                            <input ref=${inputRef} type="text" value=${query} onChange=${e => setQuery(e.target.value)} placeholder="Search content..." className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-700 bg-background focus:ring-2 focus:ring-primary outline-none" />
                            <button type="submit" disabled=${isSearching} className="px-4 py-2 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50">
                                ${isSearching ? 'Searching...' : 'Search'}
                            </button>
                        </form>
                    </div>
                    <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs font-bold text-gray-500 uppercase tracking-wider select-none">
                        <div className="flex-1 p-3 cursor-pointer hover:text-foreground" onClick=${() => handleSort('title')}>
                            Title ${sortConfig.key === 'title' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </div>
                        <div className="w-24 p-3 text-center cursor-pointer hover:text-foreground" onClick=${() => handleSort('count')}>
                            Matches ${sortConfig.key === 'count' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </div>
                        <div className="w-28 p-3 text-center cursor-pointer hover:text-foreground" onClick=${() => handleSort('createdAt')}>
                            Created ${sortConfig.key === 'createdAt' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </div>
                        <div className="w-28 p-3 text-center cursor-pointer hover:text-foreground" onClick=${() => handleSort('modifiedAt')}>
                            Updated ${sortConfig.key === 'modifiedAt' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        ${results.length === 0 && !isSearching && query && html`<div className="text-center text-gray-500 mt-10">No results found.</div>`}
                        ${sortedResults.map(r => html`
                            <div key=${r.id} onClick=${() => onNavigate(r.id)} className="flex border-b border-gray-100 dark:border-gray-800 hover:bg-primary/5 cursor-pointer group items-center">
                                <div className="flex-1 p-3 min-w-0">
                                    <div className="font-bold text-primary group-hover:underline truncate">${r.title}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 font-mono leading-relaxed break-words line-clamp-2">${highlight(r.snippet, query)}</div>
                                </div>
                                <div className="w-24 p-2 text-center flex-shrink-0">
                                    <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs text-gray-600 dark:text-gray-300">${r.count}</span>
                                </div>
                                <div className="w-28 p-2 text-center text-xs text-gray-500 flex-shrink-0">${formatDate(r.createdAt)}</div>
                                <div className="w-28 p-2 text-center text-xs text-gray-500 flex-shrink-0">${formatDate(r.modifiedAt)}</div>
                            </div>
                        `)}
                    </div>
                </div>
            </div>
        `;
    };
})(window.Jaroet);