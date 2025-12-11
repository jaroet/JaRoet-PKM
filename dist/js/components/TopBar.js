
(function(J) {
    const { useState, useRef, useEffect } = React;
    const { Icons, CalendarDropdown } = J;
    const { getCurrentVaultName, getVaultList, switchVault, deleteNote, getHomeNoteId } = J.Services.DB;
    const { goToDate } = J.Services.Journal;

    J.TopBar = (props) => {
        const {
            menu, setMenu, nav, back, forward, canBack, canForward, goHome,
            cal, setCal, calD, setCalD, handleCalendarSelect, handleCalendarMonthChange,
            favDrop, setFavDrop, favs,
            activeNote, handleFavToggle, setEd, activeHasContent, setRenN, setRen,
            canUnlink, changeRelationship, handleLinkAction,
            search, doSearch, sAct, setSAct, sRes, sIdx, setSIdx, navSearch,
            vaultMenu, setVaultMenu, setDark, dark, setSett, exportData, setImpD, setImp,
            fontSize
        } = props;

        const searchRef = useRef(null);
        const listRef = useRef(null);

        // Scroll active search result into view
        useEffect(() => {
            if (sAct && listRef.current) {
                const activeEl = listRef.current.children[sIdx];
                if (activeEl) {
                    activeEl.scrollIntoView({ block: 'nearest' });
                }
            }
        }, [sIdx, sAct]);

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

        // Vertical Separator
        const Sep = () => html`<div className="h-5 w-px bg-current opacity-10 mx-1"></div>`;

        return html`
            <div style=${{fontSize:`${Math.max(12,fontSize-4)}px`}} className="h-12 flex-shrink-0 flex items-center px-3 gap-1 z-40 relative app-bar border-b text-foreground transition-colors duration-300">
                
                <!-- Left: Navigation & Menu -->
                <div className="flex items-center gap-1">
                    <div className="relative">
                        <${Btn} onClick=${()=>setMenu(!menu)} icon=${Icons.Menu} title="Menu" active=${menu} />
                        ${menu&&html`
                            <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-gray-200 dark:border-gray-700 shadow-xl rounded-md z-50 flex flex-col py-2 animate-in fade-in slide-in-from-top-2 duration-100">
                                <div className="border-b border-gray-100 dark:border-gray-800 mb-1 pb-1">
                                    <button onClick=${()=>setVaultMenu(!vaultMenu)} className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2"><${Icons.Vault} width="16" height="16" /><span>Vault: <b>${getCurrentVaultName()}</b></span></div>
                                        <span>▼</span>
                                    </button>
                                    ${vaultMenu&&html`<div className="bg-gray-50 dark:bg-zinc-900 border-y border-gray-100 dark:border-gray-800 max-h-48 overflow-y-auto custom-scrollbar">${getVaultList().map(v=>html`<div key=${v} onClick=${()=>{switchVault(v)}} className=${`px-8 py-2 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer text-sm truncate ${v===getCurrentVaultName()?'text-primary font-bold':''}`}>${v}</div>`)}</div>`}
                                </div>
                                <button onClick=${()=>{setDark(!dark);setMenu(false)}} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex gap-2 items-center text-sm"><${dark?Icons.Sun:Icons.Moon} width="16" height="16" /><span>Toggle Theme</span></button>
                                <button onClick=${()=>{setSett(true);setMenu(false)}} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex gap-2 items-center text-sm"><${Icons.Settings} width="16" height="16" /><span>Settings</span></button>
                                <button onClick=${()=>{exportData();setMenu(false)}} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex gap-2 items-center text-sm"><${Icons.Download} width="16" height="16" /><span>Export JSON</span></button>
                                <button onClick=${()=>{const i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=ev=>{setImpD(JSON.parse(ev.target.result));setImp(true);};r.readAsText(f);}};i.click();setMenu(false);}} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex gap-2 items-center text-sm"><${Icons.Upload} width="16" height="16" /><span>Import JSON</span></button>
                            </div>
                        `}
                    </div>

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
                        <${Btn} onClick=${()=>setFavDrop(!favDrop)} icon=${Icons.FavList} title="Favorites" active=${favDrop} />
                        ${favDrop&&html`
                            <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-gray-200 dark:border-gray-700 shadow-xl rounded-md z-50 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                                <div className="p-2 text-xs font-bold uppercase text-gray-500 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">Favorites</div>
                                ${favs.length===0?html`<div className="p-4 text-center text-sm text-gray-400 italic">No favorites yet</div>`:favs.map(f=>html`<div key=${f.id} onClick=${()=>{nav(f.id);setFavDrop(false)}} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm truncate">${f.title}</div>`)}
                            </div>
                        `}
                    </div>
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
                <div className="relative flex-1 min-w-[150px] max-w-md">
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" style=${{color:'var(--theme-accent)'}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <input 
                        ref=${searchRef} 
                        value=${search} 
                        onChange=${e=>doSearch(e.target.value)} 
                        onFocus=${()=>setSAct(true)} 
                        onKeyDown=${e=>{if(e.key==='Enter'&&sRes[sIdx]){navSearch(sRes[sIdx].id);}}} 
                        placeholder="Search..." 
                        className="w-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 focus:bg-background rounded-md pl-8 pr-3 py-1 outline-none transition-all border border-transparent text-sm h-8"
                        style=${{ borderColor: sAct ? 'var(--theme-accent)' : 'transparent' }} 
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-30 text-xs pointer-events-none border border-current px-1 rounded">/</div>
                    
                    ${sAct&&sRes.length>0&&html`
                        <div ref=${listRef} className="absolute top-full left-0 right-0 mt-1 bg-card border border-gray-200 dark:border-gray-700 shadow-xl rounded-md max-h-64 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-1 duration-75">
                            ${sRes.map((r,i)=>html`
                                <div 
                                    key=${r.id} 
                                    onClick=${()=>{navSearch(r.id);}} 
                                    className=${`px-4 py-2 cursor-pointer text-sm flex justify-between ${i===sIdx?'bg-primary text-white':'hover:bg-gray-100 dark:hover:bg-gray-800'}`} 
                                    onMouseEnter=${()=>setSIdx(i)}
                                >
                                    <span className="truncate">${r.title}</span>
                                </div>
                            `)}
                        </div>
                    `}
                </div>
            </div>
        `;
    };
})(window.Jaroet);
