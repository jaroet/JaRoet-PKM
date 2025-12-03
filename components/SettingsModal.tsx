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
    resetCurrentVault
} from '../services/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCentralNoteId: string | null;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentCentralNoteId, fontSize, onFontSizeChange }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'database'>('general');
  const [homeNoteTitle, setHomeNoteTitle] = useState('Loading...');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [localFontSize, setLocalFontSize] = useState(fontSize);
  
  // Vault Management State
  const [newVaultName, setNewVaultName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [currentVault, setCurrentVault] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadHomeNote();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-background rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-2">
            <h2 className="text-xl font-bold">Settings</h2>
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
        <div className="flex-1 overflow-y-auto p-6">
            
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