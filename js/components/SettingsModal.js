
(function(J) {
    const { useState, useEffect } = React;
    const { 
        getHomeNoteId, getNote, getSectionVisibility, getAppTheme, 
        createVault, deleteCurrentVault, resetCurrentVault, 
        setHomeNoteId, setFontSize: dbSetFontSize, setAppTheme, 
        setSectionVisibility, getCurrentVaultName, searchNotes 
    } = J.Services.DB;

    J.SettingsModal = ({isOpen, onClose, currentCentralNoteId, fontSize, onFontSizeChange, onThemeChange, onSettingsChange}) => {
        // State
        const [tab, setTab] = useState('general');
        const [themeMode, setThemeMode] = useState('dark');
        const [homeTitle, setHomeTitle] = useState('Loading...');
        const [q, setQ] = useState('');
        const [res, setRes] = useState([]);
        const [localFs, setLocalFs] = useState(fontSize);
        const [appTheme, setLocalAppTheme] = useState(null);
        const [vis, setVis] = useState({showFavorites: true, showContent: true});
        const [newV, setNewV] = useState('');
        const [confDel, setConfDel] = useState(false);
        const [confReset, setConfReset] = useState(false);
        const [curVault, setCurVault] = useState('');
        const [dbLocation, setDbLocation] = useState('');

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
                    
                    // Theme
                    const t = await getAppTheme();
                    setLocalAppTheme(t);
                    
                    // Visibility
                    const v = await getSectionVisibility();
                    setVis(v);
                    
                    setLocalFs(fontSize);
                    const cv = getCurrentVaultName();
                    setCurVault(cv);
                    try {
                        const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'localhost';
                        setDbLocation(`indexeddb://${origin}/${cv}`);
                    } catch (e) {
                        setDbLocation(`indexeddb://<unknown>/${cv}`);
                    }
                    setQ(''); setRes([]);
                    setConfDel(false); setConfReset(false); setNewV('');
                    setTab('general');
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

        const handleThemeUpdate = async (key, val) => {
            if (!appTheme) return;
            const newTheme = { ...appTheme, [themeMode]: { ...appTheme[themeMode], [key]: val } };
            setLocalAppTheme(newTheme);
            await setAppTheme(newTheme);
            onThemeChange();
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

                        ${tab === 'theme' && appTheme && html`
                            <div className="space-y-6">
                                <div className="flex justify-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6">
                                    <button onClick=${() => setThemeMode('light')} className=${`flex-1 py-1 text-sm font-medium rounded-md transition-all ${themeMode === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>Light Mode</button>
                                    <button onClick=${() => setThemeMode('dark')} className=${`flex-1 py-1 text-sm font-medium rounded-md transition-all ${themeMode === 'dark' ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>Dark Mode</button>
                                </div>

                                <div className="space-y-4">
                                    ${['background', 'section', 'bars', 'accent'].map(k => html`
                                        <div key=${k} className="flex items-center justify-between">
                                            <div className="flex flex-col capitalize">
                                                <span className="font-medium text-sm">${k} Color</span>
                                            </div>
                                            <input type="color" value=${appTheme[themeMode][k]} onChange=${e => handleThemeUpdate(k, e.target.value)} className="h-8 w-14 p-0 border-0 rounded cursor-pointer" />
                                        </div>
                                    `)}
                                </div>
                                
                                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 text-right">
                                    <button onClick=${async () => {
                                        const def = {light:{background:'#f1f5f9',section:'#ffffff',accent:'#3b82f6',bars:'#e2e8f0'},dark:{background:'#1e293b',section:'#0f172a',accent:'#60a5fa',bars:'#0f172a'}};
                                        setLocalAppTheme(def); await setAppTheme(def); onThemeChange();
                                    }} className="text-sm text-gray-500 underline hover:text-primary">
                                        Reset to Default Theme
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
                                        <input type="text" placeholder="Vault Name..." className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-700 bg-background outline-none focus:ring-1 focus:ring-primary"
                                            value=${newV} onChange=${e => setNewV(e.target.value)} onKeyDown=${e => e.key === 'Enter' && newV.trim() && createVault(newV)} />
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
