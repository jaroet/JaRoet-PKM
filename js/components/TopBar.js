
(function(J) {
    const { useState, useRef, useCallback } = React;
    const { Icons, CalendarDropdown, VaultChooser } = J;
    const { deleteNote, getHomeNoteId } = J.Services.DB;
    const { goToDate } = J.Services.Journal;

    J.TopBar = (props) => {
        const {
            nav, back, forward, canBack, canForward, goHome,
            cal, setCal, calD, setCalD, handleCalendarSelect, handleCalendarMonthChange,
            favDrop, setFavDrop, favs,
            activeNote, handleFavToggle, setEd, activeHasContent, setRenN, setRen,
            canUnlink, changeRelationship, handleLinkAction,
            search, doSearch, sAct, setSAct, sRes, navSearch,
            setDark, dark, setSett, exportData, setImpD, setImp, setAllNotes,
            fontSize, sortOrder, setSortOrder
        } = props;

        const searchRef = useRef(null);
        const [sortDrop, setSortDrop] = useState(false);

        const { useClickOutside, useListNavigation } = J.Hooks;

        // Centralized hook for search list navigation
        const { activeIndex: sIdx, setActiveIndex: setSIdx, listRef, handleKeyDown: handleSearchKeyDown } = useListNavigation({
            isOpen: sAct && sRes.length > 0,
            itemCount: sRes.length,
            onEnter: (index) => {
                navSearch(sRes[index].id);
                searchRef.current?.blur();
            },
            onEscape: () => setSAct(false)
        });

        // Use the new hook for click-outside behavior
        const favDropdownContainerRef = useClickOutside(favDrop, useCallback(() => setFavDrop(false), []));
        const sortDropdownRef = useClickOutside(sortDrop, useCallback(() => setSortDrop(false), []));
        const searchDropdownContainerRef = useClickOutside(sAct && sRes.length > 0, useCallback(() => {
            setSAct(false);
            searchRef.current?.blur(); // Optionally blur the search input
        }, []));

        // Icon Button Helper
        const Btn = ({ onClick, disabled, active, icon, title, className="", forceColor=true }) => html`
            <button 
                onClick=${onClick} 
                disabled=${disabled}
                title=${title}
                style=${forceColor || active ? { color: 'var(--theme-accent)' } : {}}
                className=${`p-1.5 rounded transition-colors duration-200 ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/5 dark:hover:bg-white/10'} ${active ? 'bg-primary/10' : 'text-gray-400'} ${className}`}
            >
                <${icon} />
            </button>
        `;

        const sortOptions = [
            { id: 'title-asc', label: 'Title (A-Z)' },
            { id: 'title-desc', label: 'Title (Z-A)' },
            { id: 'created-desc', label: 'Created (Newest)' },
            { id: 'created-asc', label: 'Created (Oldest)' },
            { id: 'modified-desc', label: 'Modified (Newest)' },
            { id: 'modified-asc', label: 'Modified (Oldest)' }
        ];

        // Vertical Separator
        const Sep = () => html`<div className="h-5 w-px bg-current opacity-10 mx-1"></div>`;

        return html`
            <div 
                style=${{fontSize:`${Math.max(12,fontSize-4)}px`}} 
                className="h-12 flex-shrink-0 flex items-center px-3 gap-1 z-40 relative app-bar border-b text-foreground transition-colors duration-300"
                onClick=${e => e.stopPropagation()}
            >
                
                <!-- Left: Navigation & Menu -->
                <div className="flex items-center gap-1">
                    <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-md p-0.5 gap-0.5">
                        <${Btn} onClick=${back} disabled=${!canBack} icon=${Icons.ChevronLeft} title="Back (Alt+Left)" />
                        <${Btn} onClick=${forward} disabled=${!canForward} icon=${Icons.ChevronRight} title="Forward (Alt+Right)" />
                    </div>

                    <${Btn} onClick=${goHome} icon=${Icons.Home} title="Home" />

                    <div className="relative">
                        <${Btn} onClick=${()=>setCal(!cal)} icon=${Icons.Calendar} title="Journal (Ctrl+J)" active=${cal} />
                        <${CalendarDropdown} isOpen=${cal} onClose=${()=>setCal(false)} onSelectDate=${handleCalendarSelect} existingDates=${calD} onMonthChange=${handleCalendarMonthChange} />
                    </div>

                    <div className="relative">
                        <${Btn} onClick=${()=>setFavDrop(p=>!p)} icon=${Icons.FavList} title="Favorites" active=${favDrop} />
                        ${favDrop&&html`
                            <div 
                                className="absolute top-full left-0 mt-2 w-64 bg-card border border-gray-200 dark:border-gray-700 shadow-xl rounded-md z-50 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
                                onClick=${e => e.stopPropagation()}
                            >
                                <div className="p-2 text-xs font-bold uppercase text-gray-500 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">Favorites</div>
                                ${favs.length===0?html`<div className="p-4 text-center text-sm text-gray-400 italic">No favorites yet</div>`:favs.map(f=>html`<div key=${f.id} onClick=${()=>{nav(f.id);setFavDrop(false)}} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm truncate">${f.title}</div>`)}
                            </div>
                        `}
                    </div>

                    <${Btn} onClick=${() => setAllNotes(true)} icon=${Icons.List} title="All Notes" />
                </div>

                <${Sep} />

                <!-- Center: Active Note Actions -->
                <div className="flex items-center gap-1">
                    <${Btn} onClick=${handleFavToggle} icon=${Icons.Star} title="Toggle Favorite" active=${activeNote?.isFavorite} forceColor=${activeNote?.isFavorite} />
                    <${Btn} onClick=${()=>setEd(true)} icon=${Icons.Edit} title="Edit Content" active=${activeHasContent} forceColor=${activeHasContent} />
                    <${Btn} onClick=${()=>{if(activeNote){setRenN(activeNote);setRen(true)}}} icon=${Icons.Rename} title="Rename (F2)" />
                    <${Btn} onClick=${async()=>{if(activeNote&&confirm('Delete Note?')){await deleteNote(activeNote.id);nav(currentId===activeNote.id?await getHomeNoteId():currentId);}}} icon=${Icons.Trash} title="Delete" className="hover:text-red-500" />
                </div>

                <${Sep} />

                <!-- Right: Linking & Tools -->
                <div className="flex items-center gap-1">
                    <${Btn} onClick=${()=>changeRelationship('unlink')} disabled=${!canUnlink} icon=${Icons.Unlink} title="Unlink (Backspace)" forceColor=${canUnlink} />
                    <${Btn} onClick=${()=>handleLinkAction('left')} icon=${Icons.LinkLeft} title="Link Related (Ctrl+Left)" />
                    <${Btn} onClick=${()=>handleLinkAction('up')} icon=${Icons.LinkUp} title="Link Parent (Ctrl+Up)" />
                    <${Btn} onClick=${()=>handleLinkAction('down')} icon=${Icons.LinkDown} title="Link Child (Ctrl+Down)" />
                </div>

                <${Sep} />

                <!-- Search -->
                <div className="relative flex-1 min-w-[150px]">
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" style=${{color:'var(--theme-accent)'}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <input 
                        ref=${searchRef} 
                        value=${search} 
                        onChange=${e=>doSearch(e.target.value)} 
                        onFocus=${()=>setSAct(true)} 
                        onKeyDown=${handleSearchKeyDown} 
                        placeholder="Search..." 
                        className="w-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 focus:bg-background rounded-md pl-8 pr-3 py-1 outline-none transition-all border border-transparent text-sm h-8"
                        style=${{ borderColor: sAct ? 'var(--theme-accent)' : 'transparent' }} 
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-30 text-xs pointer-events-none border border-current px-1 rounded">/</div>
                    
                    ${sAct&&sRes.length>0&&html`
                        <div ref=${(el) => { searchDropdownContainerRef.current = el; listRef.current = el; }} className="absolute top-full left-0 right-0 mt-1 bg-card border border-gray-200 dark:border-gray-700 shadow-xl rounded-md max-h-64 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-1 duration-75">
                            ${sRes.map((r,i)=>html`
                                <div 
                                    key=${r.id} 
                                    onMouseDown=${() => {
                                        navSearch(r.id);
                                        searchRef.current?.blur();
                                    }} 
                                    className=${`px-4 py-2 cursor-pointer text-sm flex justify-between ${i===sIdx?'bg-primary text-white':'hover:bg-gray-100 dark:hover:bg-gray-800'}`} 
                                    onMouseEnter=${()=>setSIdx(i)}
                                >
                                    <span className="truncate">${r.title}</span>
                                </div>
                            `)}
                        </div>
                    `}
                </div>

                <${Sep} />

                <!-- Right: App Actions -->
                <div className="flex items-center gap-1">
                    <div className="relative">
                        <${Btn} onClick=${()=>setSortDrop(p=>!p)} icon=${Icons.Sort} title="Sort Order" active=${sortDrop} />
                        ${sortDrop&&html`
                            <div 
                                ref=${sortDropdownRef}
                                className="absolute top-full right-0 mt-2 w-48 bg-card border border-gray-200 dark:border-gray-700 shadow-xl rounded-md z-50 animate-in fade-in zoom-in-95 duration-100"
                                onClick=${e => e.stopPropagation()}
                            >
                                <div className="p-2 text-xs font-bold uppercase text-gray-500 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">Sort By</div>
                                ${sortOptions.map(opt => html`
                                    <div key=${opt.id} onClick=${()=>{setSortOrder(opt.id);setSortDrop(false)}} className=${`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm flex justify-between items-center ${sortOrder===opt.id?'text-primary font-medium':''}`}>
                                        ${opt.label}
                                        ${sortOrder===opt.id&&html`<span className="text-xs">✓</span>`}
                                    </div>
                                `)}
                            </div>
                        `}
                    </div>
                    <${Btn} onClick=${()=>setDark(!dark)} icon=${dark?Icons.Sun:Icons.Moon} title="Toggle Theme" />
                    <${Btn} onClick=${()=>setSett(true)} icon=${Icons.Settings} title="Settings" />
                    <${Btn} onClick=${exportData} icon=${Icons.Download} title="Export JSON" />
                    <${Btn} onClick=${()=>{const i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=ev=>{setImpD(JSON.parse(ev.target.result));setImp(true);};r.readAsText(f);}};i.click();}} icon=${Icons.Upload} title="Import JSON" />
                </div>

            </div>
        `;
    };
})(window.Jaroet);
