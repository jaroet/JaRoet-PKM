import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db, getTopology, createNote, updateNote, getFavorites, toggleFavorite, seedDatabase, getNote, getAllNotes, importNotes, getHomeNoteId, searchNotes, getFontSize, getNoteCount, getVaultList, getCurrentVaultName, switchVault } from './services/db';
import { Note, Section, Topology, SearchResult } from './types';
import NoteCard from './components/NoteCard';
import LinkerModal from './components/LinkerModal';
import MarkdownEditor from './components/MarkdownEditor';
import SettingsModal from './components/SettingsModal';

function App() {
  // --- State ---
  const [centralNoteId, setCentralNoteId] = useState<string | null>(null);
  const [topology, setTopology] = useState<Topology>({
    center: null,
    uppers: [],
    downers: [],
    lefters: [],
    righters: [],
  });
  const [favorites, setFavorites] = useState<Note[]>([]);
  // Default Dark Mode = true
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [totalNoteCount, setTotalNoteCount] = useState(0);
  
  // Navigation State
  const [focusedSection, setFocusedSection] = useState<Section>('center');
  const [focusedIndex, setFocusedIndex] = useState(0);
  // Remember last index for each section
  const [sectionIndices, setSectionIndices] = useState({ up: 0, down: 0, left: 0, right: 0 });

  // Modals & UI State
  const [showFavDropdown, setShowFavDropdown] = useState(false);
  const [showVaultDropdown, setShowVaultDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(0); // For keyboard nav in search
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  const [editorOpen, setEditorOpen] = useState(false);
  
  const [linkerOpen, setLinkerOpen] = useState(false);
  const [linkerType, setLinkerType] = useState<'up' | 'down' | 'left'>('up');
  const [renameValue, setRenameValue] = useState<string | null>(null); // If not null, we are renaming

  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // --- Initialization ---

  useEffect(() => {
    const init = async () => {
      // DB
      const seededId = await seedDatabase();
      const lastId = await db.meta.get('currentCentralNoteId');
      setCentralNoteId(lastId ? lastId.value : seededId);
      
      // Font Size
      const fs = await getFontSize();
      setFontSize(fs);

      refreshFavorites();
      updateTotalCount();

      // Explicitly set focus to the main container on startup
      setTimeout(() => {
        if (mainContainerRef.current) {
            mainContainerRef.current.focus();
        }
      }, 100);
    };
    init();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (centralNoteId) {
      loadTopology(centralNoteId);
      db.meta.put({ key: 'currentCentralNoteId', value: centralNoteId });
      // Reset focus to center when topology changes significantly
      setFocusedSection('center');
      setFocusedIndex(0);
      // Reset section memory when central note changes
      setSectionIndices({ up: 0, down: 0, left: 0, right: 0 });
      updateTotalCount();
    }
  }, [centralNoteId]);

  // Track indices when moving inside a section
  useEffect(() => {
    if (focusedSection !== 'center') {
      setSectionIndices(prev => ({ ...prev, [focusedSection]: focusedIndex }));
    }
  }, [focusedIndex, focusedSection]);

  // --- Scroll Into View Logic ---
  useEffect(() => {
    if (focusedSection === 'center') return;
    
    // Find the currently focused note element by its ID
    const elementId = `note-${focusedSection}-${focusedIndex}`;
    const el = document.getElementById(elementId);
    
    if (el) {
        // block: 'nearest' ensures vertical visibility without jumping
        // inline: 'nearest' ensures horizontal visibility for the flex-wrap columns
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [focusedSection, focusedIndex]);

  // --- Search Effect ---
  useEffect(() => {
    const runSearch = async () => {
        if (searchQuery.trim()) {
            const results = await searchNotes(searchQuery);
            setSearchResults(results);
            setActiveSearchIndex(0); // Reset selection on new query
        } else {
            setSearchResults([]);
            setActiveSearchIndex(0);
        }
    };
    const debounce = setTimeout(runSearch, 200);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Scroll active search result into view
  useEffect(() => {
      if (isSearchActive && searchResultsRef.current) {
          const activeEl = searchResultsRef.current.children[activeSearchIndex] as HTMLElement;
          if (activeEl) {
              activeEl.scrollIntoView({ block: 'nearest' });
          }
      }
  }, [activeSearchIndex, isSearchActive]);


  const loadTopology = async (id: string) => {
    const data = await getTopology(id);
    setTopology(data);
  };

  const refreshFavorites = async () => {
    const favs = await getFavorites();
    setFavorites(favs);
  };
  
  const updateTotalCount = async () => {
      const count = await getNoteCount();
      setTotalNoteCount(count);
  };

  // --- Derived State for Active Note ---
  const getSortedNotes = (section: Section): Note[] => {
      let notes: Note[] = [];
      if (section === 'center') return topology.center ? [topology.center] : [];
      if (section === 'up') notes = topology.uppers;
      if (section === 'down') notes = topology.downers;
      if (section === 'left') notes = topology.lefters;
      if (section === 'right') notes = topology.righters;
      
      return [...notes].sort((a, b) => a.title.localeCompare(b.title));
  };

  const getFocusedNote = (): Note | null => {
    if (focusedSection === 'center') return topology.center;
    const notes = getSortedNotes(focusedSection);
    return notes[focusedIndex] || notes[0] || null;
  };

  // --- Actions ---

  const handleFavoriteToggle = async () => {
    const note = getFocusedNote();
    if (note) {
      await toggleFavorite(note.id);
      loadTopology(centralNoteId!); // Reload to update UI
      refreshFavorites();
    }
  };

  const handleRename = async (newTitle: string) => {
    const note = getFocusedNote();
    if (note) {
      await updateNote(note.id, { title: newTitle });
      setRenameValue(null);
      loadTopology(centralNoteId!);
      refreshFavorites();
    }
  };

  const goHome = async () => {
    const homeId = await getHomeNoteId();
    if (homeId) {
        setCentralNoteId(homeId);
    } else {
        setSettingsOpen(true);
    }
  };

  const handleLinkerSelect = async (targetId: string | null, newTitle?: string) => {
    if (!centralNoteId) return;
    
    let targetNoteId = targetId;
    
    // Create new note if needed
    if (!targetNoteId && newTitle) {
      const newNote = await createNote(newTitle);
      targetNoteId = newNote.id;
    }

    if (!targetNoteId) return;

    if (linkerType === 'up') {
        const target = await getNote(targetNoteId);
        if (target && !target.linksTo.includes(centralNoteId)) {
            await updateNote(targetNoteId, { linksTo: [...target.linksTo, centralNoteId] });
        }
    } else if (linkerType === 'down') {
        const center = topology.center;
        if (center && !center.linksTo.includes(targetNoteId)) {
            await updateNote(centralNoteId, { linksTo: [...center.linksTo, targetNoteId] });
        }
    } else if (linkerType === 'left') {
        const center = topology.center;
        if (center && !center.relatedTo.includes(targetNoteId)) {
            await updateNote(centralNoteId, { relatedTo: [...center.relatedTo, targetNoteId] });
        }
    }

    loadTopology(centralNoteId);
    updateTotalCount();
  };

  const handleSearchSelect = (id: string) => {
    setCentralNoteId(id);
    setIsSearchActive(false);
    setSearchQuery('');
  };

  const exportData = async () => {
    const notes = await getAllNotes();
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexusnode_backup_${getCurrentVaultName()}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = () => {
    // Append input to DOM to ensure browser keeps file handle reference alive
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
             try {
                const text = event.target?.result as string;
                if (!text) throw new Error("Empty file");
                
                const notes = JSON.parse(text);
                await importNotes(notes);
                
                // Cleanup
                document.body.removeChild(input);
                
                // Wait for IndexedDB writes to settle
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } catch (err) {
                console.error(err);
                alert('Error importing file. It might be invalid JSON or too large.');
                if (document.body.contains(input)) document.body.removeChild(input);
            }
        };
        reader.onerror = () => {
            alert("Failed to read file");
            if (document.body.contains(input)) document.body.removeChild(input);
        };
        reader.readAsText(file);
      } else {
         if (document.body.contains(input)) document.body.removeChild(input);
      }
    };
    input.click();
  };

  // --- Keyboard Handling ---

  const handleGlobalKeyDown = useCallback(async (e: React.KeyboardEvent | KeyboardEvent) => {
    if (renameValue !== null || isSearchActive || editorOpen || linkerOpen || settingsOpen) return;

    if (e.key === '/') {
      e.preventDefault();
      setIsSearchActive(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
      return;
    }

    if (e.key === 'Backspace') {
      const note = getFocusedNote();
      if (note && centralNoteId && focusedSection !== 'center' && focusedSection !== 'right') {
        e.preventDefault();
        
        if (focusedSection === 'up') {
            const newLinks = note.linksTo.filter(id => id !== centralNoteId);
            await updateNote(note.id, { linksTo: newLinks });
        } else if (focusedSection === 'down') {
            if (topology.center) {
                const newLinks = topology.center.linksTo.filter(id => id !== note.id);
                await updateNote(centralNoteId, { linksTo: newLinks });
            }
        } else if (focusedSection === 'left') {
            if (topology.center) {
                const newRelated = topology.center.relatedTo.filter(id => id !== note.id);
                await updateNote(centralNoteId, { relatedTo: newRelated });
            }
        }
        loadTopology(centralNoteId);
      }
      return;
    }

    if (e.ctrlKey) {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setLinkerType('up');
            setLinkerOpen(true);
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setLinkerType('down');
            setLinkerOpen(true);
            return;
        }
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            setLinkerType('left');
            setLinkerOpen(true);
            return;
        }
    }

    if (e.key === 'F2') {
        e.preventDefault();
        const note = getFocusedNote();
        if (note) {
            setRenameValue(note.title);
            setTimeout(() => renameInputRef.current?.focus(), 50);
        }
        return;
    }

    if (e.key === ' ') { 
        e.preventDefault();
        setFocusedSection('center');
        return;
    }

    if (e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        const note = getFocusedNote();
        if (note) setEditorOpen(true);
        return;
    }

    if (e.key === 'Enter') {
        e.preventDefault();
        const note = getFocusedNote();
        if (note && note.id !== centralNoteId) {
            setCentralNoteId(note.id);
        }
        return;
    }

    // --- Directional Navigation ---
    
    // Improved DOM-based detection of where the next column starts
    const getItemsPerColumn = (sectionId: string) => {
        const container = document.getElementById(sectionId);
        if (!container) return 1;

        // Get all note card children
        // Filter direct children that are likely notes (based on ID convention)
        const cards = Array.from(container.children).filter(c => c.id.startsWith('note-'));
        
        if (cards.length < 2) return 1;

        // The first card should be at the far left (start of column 1)
        const firstLeft = (cards[0] as HTMLElement).offsetLeft;
        
        // Iterate until we find a card that has a significantly different 'left' position
        // This signifies the start of Column 2
        for (let i = 1; i < cards.length; i++) {
            const currentLeft = (cards[i] as HTMLElement).offsetLeft;
            // Using a tolerance (e.g., 20px) to account for minor sub-pixel rendering or borders
            if (currentLeft > firstLeft + 20) {
                return i; // The index `i` is the first item of the second column, so `i` is the count
            }
        }

        // If no wrap detected, everything is in one column
        return cards.length;
    };

    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (focusedSection === 'center') {
            if (topology.uppers.length > 0) {
                setFocusedSection('up');
                // Restore previous index, ensuring it's within bounds
                const target = Math.min(sectionIndices.up, topology.uppers.length - 1);
                setFocusedIndex(target);
            }
        } else if (focusedSection === 'down') {
             if (focusedIndex === 0) {
                setFocusedSection('center');
             } else {
                 setFocusedIndex(prev => Math.max(0, prev - 1));
             }
        } else {
            setFocusedIndex(prev => Math.max(0, prev - 1));
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (focusedSection === 'center') {
             if (topology.downers.length > 0) {
                setFocusedSection('down');
                // Restore previous index, ensuring it's within bounds
                const target = Math.min(sectionIndices.down, topology.downers.length - 1);
                setFocusedIndex(target);
             }
        } else if (focusedSection === 'up') {
            const arr = topology.uppers;
            if (focusedIndex === arr.length - 1) {
                setFocusedSection('center');
            } else {
                 setFocusedIndex(prev => Math.min(arr.length - 1, prev + 1));
            }
        } else {
            const arr = getSortedNotes(focusedSection);
            setFocusedIndex(prev => Math.min(arr.length - 1, prev + 1));
        }
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        
        if (focusedSection === 'center') {
            if (topology.lefters.length > 0) {
                setFocusedSection('left');
                // Restore previous index, ensuring it's within bounds
                const target = Math.min(sectionIndices.left, topology.lefters.length - 1);
                setFocusedIndex(target);
            }
        } else if (focusedSection === 'right') {
            setFocusedSection('center');
        } else if (focusedSection === 'up' || focusedSection === 'down') {
            // Jump one column left
            const containerId = focusedSection === 'up' ? 'container-up' : 'container-down';
            const itemsPerCol = getItemsPerColumn(containerId);
            
            const newIndex = focusedIndex - itemsPerCol;
            if (newIndex >= 0) {
                setFocusedIndex(newIndex);
            } else {
                setFocusedIndex(0); 
            }
        }
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        
        if (focusedSection === 'center') {
            if (topology.righters.length > 0) {
                setFocusedSection('right');
                // Restore previous index, ensuring it's within bounds
                const target = Math.min(sectionIndices.right, topology.righters.length - 1);
                setFocusedIndex(target);
            }
        } else if (focusedSection === 'left') {
            setFocusedSection('center');
        } else if (focusedSection === 'up' || focusedSection === 'down') {
             // Jump one column right
            const containerId = focusedSection === 'up' ? 'container-up' : 'container-down';
            const itemsPerCol = getItemsPerColumn(containerId);
            
            const arr = getSortedNotes(focusedSection);
            const newIndex = focusedIndex + itemsPerCol;
            
            if (newIndex < arr.length) {
                setFocusedIndex(newIndex);
            } else {
                setFocusedIndex(arr.length - 1);
            }
        }
    }

  }, [focusedSection, focusedIndex, topology, centralNoteId, renameValue, isSearchActive, editorOpen, linkerOpen, settingsOpen, fontSize, sectionIndices]);

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown as any);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown as any);
  }, [handleGlobalKeyDown]);

  // --- Render Helpers ---

  const renderSection = (
    notes: Note[], 
    section: Section, 
    containerClasses: string,
    itemClasses: string,
    containerId?: string
  ) => {
    // Sort notes alphabetically by title
    const sortedNotes = [...notes].sort((a, b) => a.title.localeCompare(b.title));

    return (
        <div id={containerId} className={containerClasses}>
            {sortedNotes.map((note, idx) => (
                <NoteCard
                    key={note.id}
                    id={`note-${section}-${idx}`}
                    note={note}
                    fontSize={fontSize}
                    isFocused={focusedSection === section && focusedIndex === idx}
                    onClick={() => {
                        if (note.id !== centralNoteId) setCentralNoteId(note.id);
                    }}
                    className={itemClasses}
                />
            ))}
        </div>
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
      
      {/* --- Main Content --- */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Top Bar */}
        <div className="h-14 flex-shrink-0 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-4 bg-card z-40 shadow-sm">
            
            {/* Left Group: Favorites & Home */}
            <div className="flex items-center gap-2">
                 {/* Favorites Dropdown */}
                <div className="relative">
                    <button 
                        title="Favorites"
                        onClick={() => setShowFavDropdown(!showFavDropdown)} 
                        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-yellow-500"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </button>
                    {showFavDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-gray-200 dark:border-gray-700 shadow-xl rounded-md z-50 max-h-80 overflow-y-auto">
                            <div className="p-2 font-bold text-xs uppercase text-gray-500 border-b dark:border-gray-700">Favorites</div>
                            {favorites.length === 0 && <div className="p-3 text-sm text-gray-500 italic text-center">No favorites yet</div>}
                            {favorites.map(fav => (
                                <div 
                                    key={fav.id}
                                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm truncate"
                                    onClick={() => {
                                        setCentralNoteId(fav.id);
                                        setShowFavDropdown(false);
                                    }}
                                >
                                    {fav.title}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Favorite Toggle for Current Note */}
                <button 
                    title="Toggle Favorite for current note"
                    onClick={handleFavoriteToggle} 
                    className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${getFocusedNote()?.isFavorite ? 'text-yellow-500' : 'text-gray-400'}`}
                >
                    {getFocusedNote()?.isFavorite ? '★' : '☆'}
                </button>

                <button onClick={goHome} title="Go Home" className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                    🏠
                </button>
            </div>

            {/* Center: Search - Removed max-w-lg to fill space */}
            <div className="relative flex-1">
                <input 
                    ref={searchInputRef}
                    type="text" 
                    placeholder="Search (Press /)" 
                    className="w-full bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-primary outline-none text-sm transition-all"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchActive(true)}
                    onBlur={() => setTimeout(() => setIsSearchActive(false), 200)}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            setIsSearchActive(false);
                            searchInputRef.current?.blur();
                        } else if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setActiveSearchIndex(prev => (prev + 1) % searchResults.length);
                        } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setActiveSearchIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
                        } else if (e.key === 'Enter') {
                            e.preventDefault();
                            if (searchResults.length > 0 && searchResults[activeSearchIndex]) {
                                handleSearchSelect(searchResults[activeSearchIndex].id);
                                searchInputRef.current?.blur();
                            }
                        }
                    }}
                />
                {isSearchActive && searchResults.length > 0 && (
                    <div ref={searchResultsRef} className="absolute top-full left-0 right-0 bg-card border border-gray-200 dark:border-gray-700 shadow-xl rounded-b-md mt-1 z-50 max-h-96 overflow-y-auto">
                        {searchResults.map((res, idx) => (
                            <div 
                                key={res.id} 
                                className={`px-4 py-2 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0 text-sm ${
                                    idx === activeSearchIndex ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/10'
                                }`}
                                onClick={() => handleSearchSelect(res.id)}
                            >
                                {res.title}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Right Group: Tools */}
            <div className="flex items-center gap-2">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                    {isDarkMode ? '☀' : '☾'}
                </button>
                <button onClick={() => setSettingsOpen(true)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                    ⚙
                </button>
                
                <button onClick={exportData} title="Export JSON" className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-primary">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2 2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </button>
                <button onClick={importData} title="Import JSON" className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                </button>
                
                {/* Vault Switcher */}
                <div className="relative">
                    <button 
                        onClick={() => setShowVaultDropdown(!showVaultDropdown)}
                        title="Open Vault" 
                        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-primary"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
                    </button>
                    {showVaultDropdown && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-card border border-gray-200 dark:border-gray-700 shadow-xl rounded-md z-50 max-h-80 overflow-y-auto">
                            <div className="p-2 font-bold text-xs uppercase text-gray-500 border-b dark:border-gray-700">Vaults</div>
                            {getVaultList().map(v => (
                                <div 
                                    key={v}
                                    className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm flex justify-between items-center ${
                                        v === getCurrentVaultName() ? 'text-primary font-bold' : ''
                                    }`}
                                    onClick={() => {
                                        switchVault(v);
                                        setShowVaultDropdown(false);
                                    }}
                                >
                                    <span className="truncate">{v}</span>
                                    {v === getCurrentVaultName() && <span>•</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>

        {/* Canvas Area - GUTTERED GRID */}
        {/* Changed gutter to gap-6 (double) and background to gray-100/zinc-950 for slight contrast */}
        <div 
            ref={mainContainerRef}
            className="flex-1 bg-gray-100 dark:bg-zinc-950 p-6 overflow-hidden outline-none relative" 
            tabIndex={0}
        >
            {/* Changed from percentages to fractions to handle gap without overflow */}
            <div className="grid grid-cols-[1fr_2fr_1fr] grid-rows-[1fr_minmax(150px,auto)_1fr] gap-6 h-full w-full">
                
                {/* 1. Uppers (Top Row, Spanning) */}
                {/* Changed rounded-lg to rounded-3xl and bg to white/zinc-900 */}
                <div className="col-start-1 col-end-3 row-start-1 min-h-0 min-w-0 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 relative">
                    <div className="absolute inset-0 overflow-x-auto overflow-y-hidden">
                        {renderSection(
                            topology.uppers, 
                            'up', 
                            'h-full w-fit flex flex-col flex-wrap content-start gap-0 p-3 mx-auto', 
                            'w-[300px] flex-shrink-0',
                            'container-up'
                        )}
                    </div>
                </div>

                {/* 2. Lefters (Left Col, Mid Row) */}
                <div className="col-start-1 row-start-2 min-h-0 min-w-0 relative bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800">
                    {renderSection(
                        topology.lefters, 
                        'left', 
                        'absolute inset-0 flex flex-col gap-0 overflow-y-auto p-3',
                        'w-full'
                    )}
                </div>

                {/* 3. CENTER STAGE (Center Col, Mid Row) */}
                <div className="col-start-2 row-start-2 flex items-center justify-center p-4 z-10 relative min-h-0 min-w-0 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800">
                     {topology.center && (
                        renameValue !== null && focusedSection === 'center' ? (
                            <div className="flex items-center justify-center p-6 bg-card rounded-xl border-2 border-primary shadow-lg z-20">
                                <input
                                    ref={renameInputRef}
                                    type="text"
                                    value={renameValue}
                                    onChange={e => setRenameValue(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleRename(renameValue);
                                        if (e.key === 'Escape') setRenameValue(null);
                                    }}
                                    onBlur={() => setRenameValue(null)}
                                    style={{ fontSize: `${fontSize * 1.5}px` }}
                                    className="min-w-[300px] text-center bg-transparent font-bold outline-none text-foreground"
                                />
                            </div>
                        ) : (
                            <NoteCard
                                note={topology.center}
                                fontSize={fontSize}
                                isFocused={focusedSection === 'center'}
                                isCenter={true}
                                onClick={() => {}}
                            />
                        )
                     )}
                </div>

                {/* 4. Righters (Right Col, Full Height) */}
                <div className="col-start-3 row-start-1 row-span-3 min-h-0 min-w-0 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                     {renderSection(
                        topology.righters, 
                        'right', 
                        'flex flex-col gap-0 overflow-y-auto p-3 h-full', 
                        'w-full'
                    )}
                </div>

                {/* 5. Downers (Bottom Row, Spanning) */}
                <div className="col-start-1 col-end-3 row-start-3 min-h-0 min-w-0 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 relative">
                    <div className="absolute inset-0 overflow-x-auto overflow-y-hidden">
                        {renderSection(
                            topology.downers, 
                            'down', 
                            'h-full w-fit flex flex-col flex-wrap content-start gap-0 p-3 mx-auto', 
                            'w-[300px] flex-shrink-0',
                            'container-down'
                        )}
                    </div>
                </div>

            </div>
        </div>
        
        {/* --- Footer / Status Bar --- */}
        <div className="h-8 flex-shrink-0 bg-card border-t border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 text-sm text-primary z-50">
            <div>
                Number of notes: {totalNoteCount}
            </div>
            {/* Removed 'hidden xl:block' to ensure visibility on all screen sizes, added truncate for safety */}
            <div className="opacity-80 truncate ml-4">
                Arrows: Nav | Space: Recenter | Enter: Focus | Shift+Enter: Edit | Ctrl+Arrows: Link | F2: Rename | Bksp: Unlink | DB: {getCurrentVaultName()}
            </div>
        </div>

      </div>

      {/* --- Modals --- */}
      <LinkerModal 
        isOpen={linkerOpen} 
        type={linkerType} 
        onClose={() => setLinkerOpen(false)} 
        onSelect={handleLinkerSelect} 
      />
      <MarkdownEditor 
        isOpen={editorOpen}
        note={getFocusedNote()}
        onClose={() => setEditorOpen(false)}
        onSave={(id, content) => {
            updateNote(id, { content });
            loadTopology(centralNoteId!);
        }}
      />
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentCentralNoteId={centralNoteId}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
      />
    </div>
  );
}

export default App;