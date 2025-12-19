
(function(J) {
    const { useState, useEffect, useRef } = React;
    const { 
        getHomeNoteId, getNote, getSectionVisibility, 
        createVault, deleteCurrentVault, resetCurrentVault, 
        setHomeNoteId, setFontSize: dbSetFontSize, getThemes, getTheme, saveTheme, deleteTheme, getActiveThemeId, setActiveThemeId,
        setSectionVisibility, getCurrentVaultName, searchNotes 
    } = J.Services.DB;

    J.SettingsModal = ({isOpen, onClose, currentCentralNoteId, fontSize, onFontSizeChange, onThemeChange, onSettingsChange, initialTab, focusOn}) => {
        // State
        const [tab, setTab] = useState(initialTab || 'general');
        const [homeTitle, setHomeTitle] = useState('Loading...');
        const [q, setQ] = useState('');
        const [res, setRes] = useState([]);
        const [localFs, setLocalFs] = useState(fontSize);
        const [themes, setThemes] = useState([]);
        const [curThemeId, setCurThemeId] = useState('');
        const [editingTheme, setEditingTheme] = useState(null);
        const [vis, setVis] = useState({showFavorites: true, showContent: true});
        const [newV, setNewV] = useState('');
        const [confDel, setConfDel] = useState(false);
        const [confReset, setConfReset] = useState(false);
        const [curVault, setCurVault] = useState('');
        const [dbLocation, setDbLocation] = useState('');
        const newVaultInputRef = useRef(null);

        // Initialize
        useEffect(() => {
            if (isOpen) {
                const init = async () => {
                    // Home Note
                    const hid = await getHomeNoteId();
                    if (hid) {
                        const n = await getNote(hid);
                        setHomeTitle(n ? n.title : 'Unknown Note');
                    } else {
                        setHomeTitle('Not Set');
                    }
                    
                    // Visibility
                    const v = await getSectionVisibility();
                    setVis(v);
                    
                    setLocalFs(fontSize);
                    const cv = getCurrentVaultName();
                    setCurVault(cv);
                    try {
                        const origin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') ? window.location.origin : 'local-file';
                        setDbLocation(`indexeddb://${origin}/${cv}`);
                    } catch (e) {
                        setDbLocation(`indexeddb://<unknown>/${cv}`);
                    }
                    setQ(''); setRes([]);
                    setConfDel(false); setConfReset(false); setNewV('');
                    setTab(initialTab || 'general');

                    if (focusOn === 'newVaultInput') {
                        setTimeout(() => newVaultInputRef.current?.focus(), 100);
                    }

                    // Load Themes
                    const ts = await getThemes();
                    setThemes(ts);
                    const active = await getActiveThemeId();
                    setCurThemeId(active);
                    const t = ts.find(x => x.id === active);
                    if(t) setEditingTheme(JSON.parse(JSON.stringify(t)));
                };
                init();
            }
        }, [isOpen, fontSize]);

        // Handlers
        const handleSearch = async (val) => {
            setQ(val);
            if (val.trim()) setRes(await searchNotes(val));
            else setRes([]);
        };

        const setHome = async (id, title) => {
            await setHomeNoteId(id);
            setHomeTitle(title);
            setQ(''); setRes([]);
        };

        const handleThemeSelect = async (id) => {
            setCurThemeId(id);
            await setActiveThemeId(id);
            const t = themes.find(x => x.id === id);
            if(t) setEditingTheme(JSON.parse(JSON.stringify(t)));
            onThemeChange();
        };

        const handleThemeValueChange = (key, val) => {
            if(!editingTheme) return;
            const updated = { ...editingTheme, values: { ...editingTheme.values, [key]: val } };
            setEditingTheme(updated);
        };

        const saveCurrentTheme = async () => {
            if(!editingTheme) return;
            await saveTheme(editingTheme);
            // Refresh list
            const ts = await getThemes();
            setThemes(ts);
            onThemeChange(); // Apply changes immediately
        };

        const createNewTheme = async () => {
            const name = prompt("Name for new theme:", editingTheme.name + " Copy");
            if(!name) return;
            const newId = crypto.randomUUID();
            const newTheme = { ...editingTheme, id: newId, name: name };
            await saveTheme(newTheme);
            const ts = await getThemes();
            setThemes(ts);
            handleThemeSelect(newId);
        };

        const handleVisChange = async (key, val) => {
            const newVis = { ...vis, [key]: val };
            setVis(newVis);
            await setSectionVisibility(key, val);
            onSettingsChange();
        };

        if (!isOpen) return null;

        return html`
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="w-full max-w-4xl h-[85vh] bg-card rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col text-foreground">
                    
                    <!-- Header -->
                    <div className="flex justify-between items-center p-6 pb-2">
                        <h2 className="text-xl font-bold">Settings</h2>
                        <button onClick=${onClose} className="text-gray-500 hover:text-foreground">✕</button>
                    </div>

                    <!-- Tabs -->
                    <div className="flex border-b border-gray-200 dark:border-gray-800 px-6">
                        ${['general', 'theme', 'database'].map(t => html`
                            <button 
                                key=${t}
                                onClick=${() => setTab(t)}
                                className=${`py-2 px-4 text-sm font-medium border-b-2 transition-colors capitalize ${
                                    tab === t ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-foreground'
                                }`}
                            >
                                ${t}
                            </button>
                        `)}
                    </div>

                    <!-- Content -->
                    <div className="flex-1 overflow-y-auto p-6">
                        
                        ${tab === 'general' && html`
                            <div className="space-y-6">
                                <!-- Font Size -->
                                <div className="border-b border-gray-100 dark:border-gray-800 pb-6">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Interface Font Size</h3>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm w-8">${localFs}px</span>
                                        <input 
                                            type="range" min="12" max="32" step="1" 
                                            value=${localFs} 
                                            onChange=${async e => {
                                                const s = parseInt(e.target.value);
                                                setLocalFs(s); onFontSizeChange(s); await dbSetFontSize(s);
                                            }}
                                            className="flex-1 accent-primary"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Affects note lists. Central note is 150% of this size.</p>
                                </div>

                                <!-- Visibility -->
                                <div className="border-b border-gray-100 dark:border-gray-800 pb-6">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Section Visibility</h3>
                                    <div className="flex flex-col gap-3">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                checked=${vis.showFavorites} onChange=${e => handleVisChange('showFavorites', e.target.checked)} />
                                            <span className="text-sm font-medium">Show Favorites Section</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                checked=${vis.showContent} onChange=${e => handleVisChange('showContent', e.target.checked)} />
                                            <span className="text-sm font-medium">Show Content Section</span>
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">When hidden, the section above will expand to fill the vertical space.</p>
                                </div>

                                <!-- Home Note -->
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Home Note</h3>
                                    <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-3 rounded border border-gray-200 dark:border-gray-700 mb-2">
                                        <span className="font-medium truncate">${homeTitle}</span>
                                    </div>
                                    
                                    <button 
                                        onClick=${async () => {
                                            if (currentCentralNoteId) {
                                                const n = await getNote(currentCentralNoteId);
                                                if(n) setHome(n.id, n.title);
                                            }
                                        }}
                                        className="w-full py-2 px-4 bg-primary/10 text-primary rounded hover:bg-primary/20 text-sm font-medium mb-4"
                                    >
                                        Set Current View as Home
                                    </button>

                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder="Search note to set as Home..." 
                                            className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-background focus:ring-2 focus:ring-primary outline-none"
                                            value=${q} onChange=${e => handleSearch(e.target.value)}
                                        />
                                        ${res.length > 0 && html`
                                            <div className="absolute top-full left-0 right-0 bg-card border border-gray-200 dark:border-gray-700 shadow-lg rounded-b mt-1 z-50 max-h-48 overflow-y-auto">
                                                ${res.map(r => html`
                                                    <div key=${r.id} onClick=${() => setHome(r.id, r.title)} className="p-2 hover:bg-primary/10 cursor-pointer text-sm">
                                                        ${r.title}
                                                    </div>
                                                `)}
                                            </div>
                                        `}
                                    </div>
                                </div>
                            </div>
                        `}

                        ${tab === 'theme' && editingTheme && html`
                            <div className="space-y-6">
                                <div className="flex gap-2 mb-4">
                                    <select 
                                        value=${curThemeId} 
                                        onChange=${e => handleThemeSelect(e.target.value)}
                                        className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-700 bg-background"
                                    >
                                        ${themes.map(t => html`<option key=${t.id} value=${t.id}>${t.name}</option>`)}
                                    </select>
                                    <button onClick=${createNewTheme} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:opacity-80" title="Duplicate Current Theme">+</button>
                                    ${!['light','dark'].includes(curThemeId) && html`
                                        <button onClick=${async ()=>{
                                            if(confirm('Delete theme?')){
                                                await deleteTheme(curThemeId);
                                                const ts = await getThemes();
                                                setThemes(ts);
                                                handleThemeSelect('dark');
                                            }
                                        }} className="px-3 py-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20" title="Delete Theme">🗑️</button>
                                    `}
                                </div>

                                <div className="flex items-center gap-2 mb-4">
                                    <label className="text-sm font-medium">Theme Name:</label>
                                    <input type="text" value=${editingTheme.name} onChange=${e => setEditingTheme({...editingTheme, name: e.target.value})} className="flex-1 p-1 rounded border bg-transparent" />
                                </div>

                                <div className="space-y-4">
                                    ${Object.entries(editingTheme.values).map(([k, v]) => html`
                                        <div key=${k} className="flex items-center justify-between">
                                            <span className="font-mono text-xs text-gray-500">${k}</span>
                                            <div className="flex items-center gap-2">
                                                <input type="text" value=${v} onChange=${e => handleThemeValueChange(k, e.target.value)} className="w-24 p-1 text-xs rounded border bg-transparent text-right" />
                                                <input type="color" value=${v} onChange=${e => handleThemeValueChange(k, e.target.value)} className="h-6 w-8 p-0 border-0 rounded cursor-pointer" />
                                            </div>
                                        </div>
                                    `)}
                                </div>
                                
                                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 text-right">
                                    <button onClick=${saveCurrentTheme} className="px-4 py-2 bg-primary text-white rounded hover:opacity-90">
                                        Save Theme Changes
                                    </button>
                                </div>
                            </div>
                        `}

                        ${tab === 'database' && html`
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Current Database</h3>
                                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded mb-4 border border-gray-200 dark:border-gray-700">
                                        <div className="text-xs text-gray-500 mb-1">Active Vault</div>
                                        <div className="font-mono font-bold text-lg text-primary truncate">${curVault}</div>
                                    </div>
                                </div>

                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">IndexedDB Location</h3>
                                                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded mb-4 border border-gray-200 dark:border-gray-700">
                                                    <div className="text-xs text-gray-500 mb-1">Where data is stored (read-only)</div>
                                                    <div className="font-mono text-sm break-words text-foreground">${dbLocation}</div>
                                                </div>
                                            </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">New Vault</h3>
                                    <div className="flex gap-2">
                                        <input ref=${newVaultInputRef} type="text" placeholder="Vault Name..." className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-700 bg-background outline-none focus:ring-1 focus:ring-primary"
                                            value=${newV} onChange=${e => setNewV(e.target.value)} onKeyDown=${e => e.key === 'Enter' && newV.trim() && createVault(newV.trim())} />
                                        <button onClick=${() => newV.trim() && createVault(newV)} disabled=${!newV.trim()} className="px-3 py-2 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50">Create</button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Danger Zone</h3>
                                    <div>
                                        <button onClick=${() => confReset ? resetCurrentVault() : setConfReset(true)} className=${`w-full py-2 px-4 rounded text-sm font-medium transition-all ${confReset ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-200 dark:bg-gray-700 text-foreground hover:opacity-80'}`}>
                                            ${confReset ? 'Confirm: Reset (Clear Data)' : 'Reset Current Vault'}
                                        </button>
                                        ${confReset && html`<p className="text-xs text-red-500 mt-1 text-center">Warning: All notes in this vault will be lost.</p>`}
                                    </div>
                                    <div>
                                        <button onClick=${() => confDel ? deleteCurrentVault() : setConfDel(true)} className=${`w-full py-2 px-4 rounded text-sm font-medium transition-all ${confDel ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}>
                                            ${confDel ? 'Confirm: DELETE VAULT PERMANENTLY' : 'Delete Current Vault'}
                                        </button>
                                        ${confDel && html`<p className="text-xs text-red-500 mt-1 text-center">Warning: This vault and all its data will be destroyed.</p>`}
                                    </div>
                                </div>
                            </div>
                        `}
                    </div>

                    <!-- Footer -->
                    <div className="flex justify-end p-4 border-t border-gray-100 dark:border-gray-800">
                        <button onClick=${onClose} className="px-4 py-2 rounded bg-primary text-white hover:opacity-90">Done</button>
                    </div>
                </div>
            </div>
        `;
    };
})(window.Jaroet);
