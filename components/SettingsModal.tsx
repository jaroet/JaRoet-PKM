
import React, { useState, useEffect } from 'react';
import { SearchResult } from '../types';
import { 
    searchNotes, 
    getNote, 
    getHomeNoteId, 
    setHomeNoteId, 
    setFontSize as dbSetFontSize,
    getCurrentVaultName,
    createVault,
    deleteCurrentVault,
    resetCurrentVault,
    getAppTheme,
    setAppTheme,
    AppTheme,
    ThemeConfig,
    getSectionVisibility,
    setSectionVisibility
} from '../services/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCentralNoteId: string | null;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  onThemeChange: () => void;
  onSettingsChange: () => void;
}

// --- Theme Presets Definition ---
const PRESETS = {
    light: [
        { 
            name: 'Classic Slate', 
            colors: { background: '#f1f5f9', section: '#ffffff', bars: '#e2e8f0', accent: '#3b82f6' } 
        },
        { 
            name: 'Warm Paper', 
            colors: { background: '#f5f5f4', section: '#ffffff', bars: '#e7e5e4', accent: '#f97316' } 
        },
        { 
            name: 'Soft Sage', 
            colors: { background: '#f0fdf4', section: '#ffffff', bars: '#dcfce7', accent: '#15803d' } 
        },
        { 
            name: 'Minimalist', 
            colors: { background: '#e5e5e5', section: '#ffffff', bars: '#d4d4d4', accent: '#171717' } 
        },
    ],
    dark: [
        { 
            name: 'Classic Navy', 
            colors: { background: '#1e293b', section: '#0f172a', bars: '#0f172a', accent: '#60a5fa' } 
        },
        { 
            name: 'Deep Night', 
            colors: { background: '#020617', section: '#1e293b', bars: '#1e293b', accent: '#818cf8' } 
        },
        { 
            name: 'Forest', 
            colors: { background: '#022c22', section: '#064e3b', bars: '#064e3b', accent: '#34d399' } 
        },
        { 
            name: 'High Contrast', 
            colors: { background: '#000000', section: '#121212', bars: '#121212', accent: '#facc15' } 
        },
    ]
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentCentralNoteId, fontSize, onFontSizeChange, onThemeChange, onSettingsChange }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'theme' | 'database'>('general');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const [homeNoteTitle, setHomeNoteTitle] = useState('Loading...');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [localFontSize, setLocalFontSize] = useState(fontSize);
  
  const [appTheme, setLocalAppTheme] = useState<AppTheme | null>(null);
  const [showFavorites, setShowFavorites] = useState(true);
  const [showContent, setShowContent] = useState(true);
  
  // Vault Management State
  const [newVaultName, setNewVaultName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [currentVault, setCurrentVault] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadHomeNote();
      loadTheme();
      loadVisibility();
      setSearchQuery('');
      setSearchResults([]);
      setLocalFontSize(fontSize);
      setCurrentVault(getCurrentVaultName());
      
      // Reset confirmations and inputs
      setConfirmDelete(false);
      setConfirmReset(false);
      setNewVaultName('');
      setActiveTab('general'); // Reset to general tab on open
    }
  }, [isOpen, fontSize]);

  const loadTheme = async () => {
      const t = await getAppTheme();
      setLocalAppTheme(t);
  };

  const loadVisibility = async () => {
      const v = await getSectionVisibility();
      setShowFavorites(v.showFavorites);
      setShowContent(v.showContent);
  };

  const loadHomeNote = async () => {
    const id = await getHomeNoteId();
    if (id) {
      const note = await getNote(id);
      setHomeNoteTitle(note ? note.title : 'Unknown Note');
    } else {
      setHomeNoteTitle('Not Set');
    }
  };

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.trim()) {
      const res = await searchNotes(val);
      setSearchResults(res);
    } else {
      setSearchResults([]);
    }
  };

  const setHome = async (id: string, title: string) => {
    await setHomeNoteId(id);
    setHomeNoteTitle(title);
    setSearchQuery('');
    setSearchResults([]);
  };

  const setCenterAsHome = async () => {
    if (currentCentralNoteId) {
        const note = await getNote(currentCentralNoteId);
        if (note) {
            await setHome(note.id, note.title);
        }
    }
  };

  const handleFontSizeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const size = parseInt(e.target.value);
      setLocalFontSize(size);
      onFontSizeChange(size);
      await dbSetFontSize(size);
  };
  
  const handleThemeUpdate = async (key: keyof AppTheme['light'], value: string) => {
      if (!appTheme) return;
      const newTheme = {
          ...appTheme,
          [themeMode]: {
              ...appTheme[themeMode],
              [key]: value
          }
      };
      setLocalAppTheme(newTheme);
      await setAppTheme(newTheme);
      onThemeChange();
  };

  const applyPreset = async (presetColors: ThemeConfig) => {
      if (!appTheme) return;
      const newTheme = {
          ...appTheme,
          [themeMode]: {
              ...presetColors
          }
      };
      setLocalAppTheme(newTheme);
      await setAppTheme(newTheme);
      onThemeChange();
  };

  const handleVisibilityChange = async (key: 'showFavorites' | 'showContent', val: boolean) => {
      if (key === 'showFavorites') setShowFavorites(val);
      if (key === 'showContent') setShowContent(val);
      
      await setSectionVisibility(key, val);
      onSettingsChange();
  };

  const handleCreateVault = () => {
      if (newVaultName.trim()) {
          createVault(newVaultName.trim());
      }
  };
  
  const handleReset = () => {
      if (confirmReset) {
          resetCurrentVault();
      } else {
          setConfirmReset(true);
      }
  };

  const handleDelete = () => {
      if (confirmDelete) {
          deleteCurrentVault();
      } else {
          setConfirmDelete(true);
      }
  };

  // Helper to check equality for highlighting current preset
  const isCurrentPreset = (preset: ThemeConfig) => {
      if (!appTheme) return false;
      const current = appTheme[themeMode];
      return (
          current.background.toLowerCase() === preset.background.toLowerCase() &&
          current.section.toLowerCase() === preset.section.toLowerCase() &&
          current.bars.toLowerCase() === preset.bars.toLowerCase() &&
          current.accent.toLowerCase() === preset.accent.toLowerCase()
      );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl h-[85vh] bg-background rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-2">
            <h2 className="text-xl font-bold text-foreground">Settings</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-foreground">✕</button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 px-6">
            <button
                className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'general' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-foreground'
                }`}
                onClick={() => setActiveTab('general')}
            >
                General
            </button>
            <button
                className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'theme' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-foreground'
                }`}
                onClick={() => setActiveTab('theme')}
            >
                Theme
            </button>
            <button
                className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'database' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-foreground'
                }`}
                onClick={() => setActiveTab('database')}
            >
                Database
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-foreground">
            
            {activeTab === 'general' && (
                <div className="space-y-6">
                    {/* Font Size Settings */}
                    <div className="border-b border-gray-100 dark:border-gray-800 pb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Interface Font Size</h3>
                        <div className="flex items-center gap-4">
                            <span className="text-sm w-8">{localFontSize}px</span>
                            <input 
                                type="range" 
                                min="12" 
                                max="32" 
                                step="1"
                                value={localFontSize}
                                onChange={handleFontSizeChange}
                                className="flex-1 accent-primary"
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Affects note lists. Central note is 150% of this size.</p>
                    </div>

                    {/* Section Visibility */}
                    <div className="border-b border-gray-100 dark:border-gray-800 pb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Section Visibility</h3>
                        <div className="flex flex-col gap-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={showFavorites}
                                    onChange={(e) => handleVisibilityChange('showFavorites', e.target.checked)}
                                />
                                <span className="text-sm font-medium">Show Favorites Section</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={showContent}
                                    onChange={(e) => handleVisibilityChange('showContent', e.target.checked)}
                                />
                                <span className="text-sm font-medium">Show Content Section</span>
                            </label>
                        </div>
                         <p className="text-xs text-gray-400 mt-2">When hidden, the section above will expand to fill the vertical space.</p>
                    </div>

                    {/* Home Note Settings */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Home Note</h3>
                        <div className="flex items-center justify-between bg-card p-3 rounded border border-gray-200 dark:border-gray-700 mb-2">
                            <span className="font-medium truncate">{homeNoteTitle}</span>
                        </div>
                        
                        <button 
                            onClick={setCenterAsHome}
                            className="w-full py-2 px-4 bg-primary/10 text-primary rounded hover:bg-primary/20 text-sm font-medium mb-4"
                        >
                            Set Current View as Home
                        </button>

                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search note to set as Home..."
                                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-background focus:ring-2 focus:ring-primary outline-none"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-card border border-gray-200 dark:border-gray-700 shadow-lg rounded-b mt-1 z-50 max-h-48 overflow-y-auto">
                                    {searchResults.map(res => (
                                        <div 
                                            key={res.id} 
                                            className="p-2 hover:bg-primary/10 cursor-pointer text-sm"
                                            onClick={() => setHome(res.id, res.title)}
                                        >
                                            {res.title}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'theme' && appTheme && (
                <div className="space-y-6">
                    {/* Theme Mode Toggle */}
                    <div className="flex justify-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6">
                        <button
                            className={`flex-1 py-1 text-sm font-medium rounded-md transition-all ${
                                themeMode === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                            }`}
                            onClick={() => setThemeMode('light')}
                        >
                            Light Mode
                        </button>
                        <button
                            className={`flex-1 py-1 text-sm font-medium rounded-md transition-all ${
                                themeMode === 'dark' ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                            }`}
                            onClick={() => setThemeMode('dark')}
                        >
                            Dark Mode
                        </button>
                    </div>

                    {/* Presets Grid */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Default Themes</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {PRESETS[themeMode].map((preset) => (
                                <div 
                                    key={preset.name}
                                    onClick={() => applyPreset(preset.colors)}
                                    className={`
                                        cursor-pointer rounded-lg border-2 overflow-hidden transition-all group
                                        ${isCurrentPreset(preset.colors) 
                                            ? 'border-primary ring-2 ring-primary ring-offset-1 ring-offset-background' 
                                            : 'border-transparent hover:scale-105 shadow-sm hover:shadow-md'
                                        }
                                    `}
                                    title={preset.name}
                                >
                                    {/* Simulated Screen Preview */}
                                    <div className="w-full h-20 flex flex-col" style={{ backgroundColor: preset.colors.background }}>
                                        {/* Top Bar */}
                                        <div className="h-4 w-full flex items-center px-1 gap-1 border-b border-black/5 dark:border-white/5" style={{ backgroundColor: preset.colors.bars }}>
                                            <div className="w-2 h-2 rounded-full opacity-50" style={{ backgroundColor: preset.colors.accent }}></div>
                                        </div>
                                        
                                        {/* Body */}
                                        <div className="flex-1 p-2 flex gap-1.5 justify-center items-start">
                                             {/* Column 1 */}
                                             <div className="w-1/4 h-3/4 rounded-[2px] opacity-80" style={{ backgroundColor: preset.colors.section }}></div>
                                             {/* Column 2 (Center) */}
                                             <div className="w-1/3 h-full rounded-[2px] relative shadow-sm" style={{ backgroundColor: preset.colors.section }}>
                                                {/* Active Element Dot */}
                                                <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: preset.colors.accent }}></div>
                                             </div>
                                             {/* Column 3 */}
                                             <div className="w-1/4 h-3/4 rounded-[2px] opacity-80" style={{ backgroundColor: preset.colors.section }}></div>
                                        </div>
                                    </div>
                                    {/* Label */}
                                    <div className="text-xs text-center py-2 font-medium bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-gray-300 border-t border-gray-100 dark:border-gray-800">
                                        {preset.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Fine Tune Colors</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">Background</span>
                                    <span className="text-xs text-gray-500">Gutters/Canvas</span>
                                </div>
                                <input 
                                    type="color" 
                                    value={appTheme[themeMode].background}
                                    onChange={e => handleThemeUpdate('background', e.target.value)}
                                    className="h-8 w-14 p-0 border-0 rounded cursor-pointer bg-transparent"
                                />
                            </div>

                            <div className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">Section</span>
                                    <span className="text-xs text-gray-500">Cards/Containers</span>
                                </div>
                                <input 
                                    type="color" 
                                    value={appTheme[themeMode].section}
                                    onChange={e => handleThemeUpdate('section', e.target.value)}
                                    className="h-8 w-14 p-0 border-0 rounded cursor-pointer bg-transparent"
                                />
                            </div>

                            <div className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">Bars</span>
                                    <span className="text-xs text-gray-500">Top/Status Bar</span>
                                </div>
                                <input 
                                    type="color" 
                                    value={appTheme[themeMode].bars}
                                    onChange={e => handleThemeUpdate('bars', e.target.value)}
                                    className="h-8 w-14 p-0 border-0 rounded cursor-pointer bg-transparent"
                                />
                            </div>

                            <div className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">Accent</span>
                                    <span className="text-xs text-gray-500">Icons/Highlights</span>
                                </div>
                                <input 
                                    type="color" 
                                    value={appTheme[themeMode].accent}
                                    onChange={e => handleThemeUpdate('accent', e.target.value)}
                                    className="h-8 w-14 p-0 border-0 rounded cursor-pointer bg-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'database' && (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Current Database</h3>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded mb-4 border border-gray-200 dark:border-gray-700">
                            <div className="text-xs text-gray-500 mb-1">Active Vault</div>
                            <div className="font-mono font-bold text-lg text-primary truncate">{currentVault}</div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">New Vault</h3>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Vault Name..." 
                                className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-700 bg-background outline-none focus:ring-1 focus:ring-primary"
                                value={newVaultName}
                                onChange={e => setNewVaultName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreateVault()}
                            />
                            <button 
                                onClick={handleCreateVault}
                                disabled={!newVaultName.trim()}
                                className="px-3 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
                            >
                                Create
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Danger Zone</h3>
                        
                        <div>
                            <button 
                                onClick={handleReset}
                                className={`w-full py-2 px-4 rounded text-sm font-medium transition-all ${
                                    confirmReset 
                                        ? 'bg-red-500 text-white hover:bg-red-600' 
                                        : 'bg-gray-200 dark:bg-gray-700 text-foreground hover:opacity-80'
                                }`}
                            >
                                {confirmReset ? 'Confirm: Reset (Clear Data)' : 'Reset Current Vault'}
                            </button>
                            {confirmReset && <p className="text-xs text-red-500 mt-1 text-center">Warning: All notes in this vault will be lost.</p>}
                        </div>

                        <div>
                            <button 
                                onClick={handleDelete}
                                className={`w-full py-2 px-4 rounded text-sm font-medium transition-all ${
                                    confirmDelete 
                                        ? 'bg-red-500 text-white hover:bg-red-600' 
                                        : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                }`}
                            >
                                {confirmDelete ? 'Confirm: DELETE VAULT PERMANENTLY' : 'Delete Current Vault'}
                            </button>
                             {confirmDelete && <p className="text-xs text-red-500 mt-1 text-center">Warning: This vault and all its data will be destroyed.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-100 dark:border-gray-800">
            <button onClick={onClose} className="px-4 py-2 rounded bg-primary text-primary-foreground hover:opacity-90">Done</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
