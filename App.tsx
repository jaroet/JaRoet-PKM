
import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { marked } from 'marked';
import { db, getTopology, createNote, updateNote, deleteNote, getFavorites, toggleFavorite, seedDatabase, getNote, getAllNotes, importNotes, getHomeNoteId, searchNotes, getFontSize, getNoteCount, getVaultList, getCurrentVaultName, switchVault, getAppTheme, AppTheme, getSectionVisibility, findNoteByTitle, getNoteTitlesByPrefix } from './services/db';
import { goToToday, goToDate } from './services/journal';
import { useHistory } from './hooks/useHistory';
import { Note, Section, Topology, SearchResult } from './types';
import NoteCard from './components/NoteCard';
import LinkerModal from './components/LinkerModal';
import MarkdownEditor from './components/MarkdownEditor';
import SettingsModal from './components/SettingsModal';
import RenameModal from './components/RenameModal';
import ImportModal from './components/ImportModal';
import CalendarDropdown from './components/CalendarDropdown';
import { createRenderer, wikiLinkExtension } from './services/markdown';
import { getDateSubtitle } from './services/dateUtils';

// --- Markdown Configuration ---

// Configure Global Marked Instance (used for Preview in Main Canvas)
// Use the shared renderer, but with disabled checkboxes for the read-only view
const renderer = createRenderer({ clickableCheckboxes: false });

marked.use({ 
    renderer, 
    extensions: [wikiLinkExtension as any] 
});

// Shared styles for markdown content (editor and preview)
const compactMarkdownStyles = `
  .compact-markdown ul, .compact-markdown ol {
      margin-top: 0.25em !important;
      margin-bottom: 0.25em !important;
  }
  .compact-markdown li {
      margin-top: 0 !important;
      margin-bottom: 0 !important;
  }
  .compact-markdown li > p {
      margin-top: 0 !important;
      margin-bottom: 0 !important;
  }
  .compact-markdown li.task-list-item {
      list-style-type: none;
      padding-left: 0;
  }
`;

// --- NoteSection Component ---
interface NoteSectionProps {
  notes: Note[];
  section: Section;
  containerClasses: string;
  itemClasses: string;
  containerId: string;
  fontSize: number;
  focusedSection: Section;
  focusedIndex: number;
  selectedNoteIds: Set<string>;
  centralNoteId: string | null;
  onNoteClick: (id: string, isCtrl: boolean) => void;
  scrollPositionsRef: React.MutableRefObject<Record<string, number>>;
}

const NoteSection: React.FC<NoteSectionProps> = ({ 
    notes, section, containerClasses, itemClasses, containerId, 
    fontSize, focusedSection, focusedIndex, selectedNoteIds, centralNoteId, 
    onNoteClick, scrollPositionsRef 
}) => {
    const sortedNotes = [...notes].sort((a, b) => a.title.localeCompare(b.title));
    
    // Restore scroll
    useLayoutEffect(() => {
        const el = document.getElementById(containerId);
        if (el) {
            const savedPos = scrollPositionsRef.current[containerId] || 0;
            if (el.scrollTop !== savedPos) {
                el.scrollTop = savedPos;
            }
        }
    }, [sortedNotes.map(n => n.id).join(','), section, containerId, scrollPositionsRef]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        scrollPositionsRef.current[containerId] = target.scrollTop;
    };

    return (
        <div id={containerId} className={containerClasses} onScroll={handleScroll}>
            {sortedNotes.map((note, idx) => (
                <NoteCard
                    key={note.id}
                    id={`note-${section}-${idx}`}
                    note={note}
                    fontSize={fontSize}
                    isFocused={focusedSection === section && focusedIndex === idx}
                    isSelected={selectedNoteIds.has(note.id)}
                    onClick={(e) => onNoteClick(note.id, e.ctrlKey)}
                    className={itemClasses}
                />
            ))}
        </div>
    );
};

function App() {
  // --- Navigation History Hook ---
  const { currentId: centralNoteId, visit, replace, back, forward, canBack, canForward } = useHistory();

  // --- State ---
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
  // Force update trigger for theme/settings changes
  const [themeTick, setThemeTick] = useState(0);
  const [totalNoteCount, setTotalNoteCount] = useState(0);

  // Settings: Visibility
  const [showFavorites, setShowFavorites] = useState(true);
  const [showContent, setShowContent] = useState(true);
  
  // Navigation State
  const [focusedSection, setFocusedSection] = useState<Section>('center');
  const [focusedIndex, setFocusedIndex] = useState(0);
  // Remember last index for each section
  const [sectionIndices, setSectionIndices] = useState({ up: 0, down: 0, left: 0, right: 0, favs: 0 });

  // Scroll Position State
  // We use a Ref to track scroll positions to avoid re-renders on every scroll event
  const scrollPositionsRef = useRef<Record<string, number>>({});

  // Selection State
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  // Ref to track selection for event handlers to avoid stale closures
  const selectedNoteIdsRef = useRef<Set<string>>(new Set());

  // Modals & UI State
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showFavDropdown, setShowFavDropdown] = useState(false);
  const [showVaultListInMenu, setShowVaultListInMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(0); // For keyboard nav in search
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  // Calendar State
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [existingJournalDates, setExistingJournalDates] = useState<Set<string>>(new Set());

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'view' | 'edit'>('view');
  
  const [linkerOpen, setLinkerOpen] = useState(false);
  const [linkerType, setLinkerType] = useState<'up' | 'down' | 'left'>('up');
  
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [noteToRename, setNoteToRename] = useState<Note | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Import State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<Note[]>([]);

  // Content Preview State
  const [previewHtml, setPreviewHtml] = useState('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const contentPreviewRef = useRef<HTMLDivElement>(null);

  // --- Initialization ---

  useEffect(() => {
    const init = async () => {
      // DB
      const seededId = await seedDatabase();
      const lastId = await db.meta.get('currentCentralNoteId');
      // Initialize History with the starting note
      replace(lastId ? lastId.value : seededId);
      
      // Font Size
      const fs = await getFontSize();
      setFontSize(fs);

      // Visibility
      const vis = await getSectionVisibility();
      setShowFavorites(vis.showFavorites);
      setShowContent(vis.showContent);

      refreshFavorites();
      updateTotalCount();

      // Explicitly set focus to the main container on startup
      setTimeout(() => {
        if (mainContainerRef.current) {
            mainContainerRef.current.focus();
        }
      }, 100);

      // Set Document Title
      document.title = `JaRoet PKM - ${getCurrentVaultName()}`;
    };
    init();
  }, []);

  const refreshSettings = async () => {
       const vis = await getSectionVisibility();
       setShowFavorites(vis.showFavorites);
       setShowContent(vis.showContent);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Sync Ref with State
  useEffect(() => {
      selectedNoteIdsRef.current = selectedNoteIds;
  }, [selectedNoteIds]);

  // Apply Theme Color via CSS Variables
  useEffect(() => {
    const applyTheme = async () => {
        const theme: AppTheme = await getAppTheme();
        const styleId = 'dynamic-theme-styles';
        let styleTag = document.getElementById(styleId);
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = styleId;
          document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = `
          :root {
            --theme-bg: ${theme.light.background};
            --theme-section: ${theme.light.section};
            --theme-bars: ${theme.light.bars};
            --theme-accent: ${theme.light.accent};
            --primary: ${theme.light.accent};
          }
          .dark {
            --theme-bg: ${theme.dark.background};
            --theme-section: ${theme.dark.section};
            --theme-bars: ${theme.dark.bars};
            --theme-accent: ${theme.dark.accent};
            --primary: ${theme.dark.accent};
          }
        `;
    };
    applyTheme();
  }, [themeTick]);

  useEffect(() => {
    if (centralNoteId) {
      loadTopology(centralNoteId);
      db.meta.put({ key: 'currentCentralNoteId', value: centralNoteId });
      // Reset focus to center when topology changes significantly
      setFocusedSection('center');
      setFocusedIndex(0);
      // Reset section memory when central note changes
      setSectionIndices({ up: 0, down: 0, left: 0, right: 0, favs: 0 });
      // Clear selection on navigation
      setSelectedNoteIds(new Set());
      // Reset Scroll Positions when center changes
      scrollPositionsRef.current = {};
      updateTotalCount();
    }
  }, [centralNoteId]);

  // Track indices when moving inside a section
  useEffect(() => {
    if (focusedSection !== 'center' && focusedSection !== 'content') {
      setSectionIndices(prev => ({ ...prev, [focusedSection]: focusedIndex }));
    }
  }, [focusedIndex, focusedSection]);

  // --- Scroll Into View Logic ---
  useEffect(() => {
    if (focusedSection === 'center' || focusedSection === 'content') return;
    
    // Find the currently focused note element by its ID
    const elementId = `note-${focusedSection}-${focusedIndex}`;
    const el = document.getElementById(elementId);
    
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [focusedSection, focusedIndex]);

  // Focus Content Preview if selected
  useEffect(() => {
      if (focusedSection === 'content' && contentPreviewRef.current) {
          contentPreviewRef.current.focus();
      }
  }, [focusedSection]);

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
  const getSortedNotes = useCallback((section: Section): Note[] => {
      let notes: Note[] = [];
      if (section === 'center') return topology.center ? [topology.center] : [];
      if (section === 'up') notes = topology.uppers;
      if (section === 'down') notes = topology.downers;
      if (section === 'left') notes = topology.lefters;
      if (section === 'right') notes = topology.righters;
      if (section === 'favs') notes = favorites;
      
      return [...notes].sort((a, b) => a.title.localeCompare(b.title));
  }, [topology, favorites]);

  const getFocusedNote = useCallback(() => {
    if (focusedSection === 'content') return topology.center;
    if (focusedSection === 'center') return topology.center;
    const notes = getSortedNotes(focusedSection);
    return notes[focusedIndex] || null;
  }, [focusedSection, focusedIndex, getSortedNotes, topology]);

  // Update Preview when focus changes
  useEffect(() => {
      const updatePreview = async () => {
          const target = getFocusedNote() || topology.center;
          if (target && target.content) {
              try {
                const html = await marked.parse(target.content, { breaks: true, gfm: true });
                setPreviewHtml(html);
              } catch {
                setPreviewHtml('<p class="text-red-500">Error rendering markdown</p>');
              }
          } else {
              setPreviewHtml('<p class="text-gray-500 italic">No content</p>');
          }
      };
      const t = setTimeout(updatePreview, 100);
      return () => clearTimeout(t);
  }, [focusedSection, focusedIndex, topology, favorites]);


  // Ensure focus index is valid when topology changes
  useEffect(() => {
    // Safety check if hidden sections are focused
    if (focusedSection === 'favs' && !showFavorites) {
        setFocusedSection('left');
        setFocusedIndex(0);
        return;
    }
    if (focusedSection === 'content' && !showContent) {
        setFocusedSection('right');
        setFocusedIndex(0);
        return;
    }

    if (focusedSection === 'center' || focusedSection === 'content') return;

    const notes = getSortedNotes(focusedSection);
    if (notes.length === 0) {
        setFocusedSection('center');
        setFocusedIndex(0);
        return;
    }
    if (focusedIndex >= notes.length) {
        setFocusedIndex(notes.length - 1);
    }
  }, [topology, favorites, focusedSection, focusedIndex, getSortedNotes, showFavorites, showContent]);


  // --- Actions ---

  const handleFavoriteToggle = async () => {
    const note = getFocusedNote();
    if (note) {
      await toggleFavorite(note.id);
      loadTopology(centralNoteId!);
      refreshFavorites();
    }
  };

  const handleJournalToday = async () => {
      const todayId = await goToToday();
      visit(todayId);
  };
  
  const handleCalendarSelect = async (date: Date) => {
      setCalendarOpen(false);
      const noteId = await goToDate(date);
      visit(noteId);
  };

  const handleCalendarMonthChange = async (year: number, month: number) => {
      const prefix = `${year}-${String(month).padStart(2, '0')}-`;
      const matchingTitles = await getNoteTitlesByPrefix(prefix);
      setExistingJournalDates(new Set(matchingTitles));
  };

  const handleRename = async (newTitle: string) => {
    if (noteToRename) {
      await updateNote(noteToRename.id, { title: newTitle });
      setNoteToRename(null);
      loadTopology(centralNoteId!);
      refreshFavorites();
    }
  };

  const handleStartRename = () => {
    const note = getFocusedNote();
    if (note) {
        setNoteToRename(note);
        setRenameModalOpen(true);
    }
  };

  const handleOpenEditor = (mode: 'view' | 'edit') => {
    const note = getFocusedNote();
    if (note) {
        setEditorMode(mode);
        setEditorOpen(true);
    }
  };

  // Internal Linking Logic
  const handleInternalLinkClick = async (title: string) => {
      // 1. Check if note exists
      const targetNote = await findNoteByTitle(title);
      
      if (targetNote) {
          // 2. Set Central Note using History
          visit(targetNote.id);
          
          // 3. Smart View Switch
          if (editorOpen) {
              if (targetNote.content && targetNote.content.trim().length > 0) {
                  // Keep editor open, just refresh content (handled by useEffect on note prop)
              } else {
                  setEditorOpen(false);
              }
          }
      } else {
          alert(`Note "${title}" not found.`);
      }
  };

  // Handle clicks in Canvas Content Preview
  const handleCanvasContentClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('internal-link')) {
          e.preventDefault();
          const title = target.getAttribute('data-title');
          if (title) {
              handleInternalLinkClick(title);
          }
      }
  };

  const goHome = useCallback(async () => {
    const homeId = await getHomeNoteId();
    if (homeId) {
        const exists = await getNote(homeId);
        if (exists) {
            visit(homeId);
        } else {
            // Home note deleted? Fallback
            const all = await getAllNotes();
            if (all.length > 0) {
                visit(all[0].id);
            } else {
                const newId = await seedDatabase();
                if (newId) visit(newId);
            }
        }
    } else {
        // No home set, open settings
        setSettingsOpen(true);
    }
  }, [visit]);

  const performDelete = useCallback(async (note: Note) => {
        await deleteNote(note.id);
        if (note.id === centralNoteId) {
            goHome(); 
        } else {
            if (centralNoteId) loadTopology(centralNoteId);
        }
        refreshFavorites();
        updateTotalCount();
  }, [centralNoteId, goHome]);

  const performBulkDelete = useCallback(async (ids: string[]) => {
      let centerDeleted = false;
      for (const id of ids) {
          await deleteNote(id);
          if (id === centralNoteId) centerDeleted = true;
      }

      if (centerDeleted) {
          await goHome();
      } else {
          if (centralNoteId) await loadTopology(centralNoteId);
      }
      refreshFavorites();
      updateTotalCount();
      setSelectedNoteIds(new Set()); 
  }, [centralNoteId, goHome]);

  const handleDeleteAction = useCallback(async (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    
    const selectedIds = Array.from(selectedNoteIdsRef.current);
    if (selectedIds.length > 0) {
        if(confirm(`Are you sure you want to delete ${selectedIds.length} selected notes?`)) {
            await performBulkDelete(selectedIds);
        }
    } else {
        const note = getFocusedNote();
        if (note) {
            await performDelete(note);
        }
    }
  }, [selectedNoteIds, getFocusedNote, performBulkDelete, performDelete]);

  const getSelectedOrFocusedNotes = () => {
      if (selectedNoteIdsRef.current.size > 0) {
          return Array.from(selectedNoteIdsRef.current);
      }
      const active = getFocusedNote();
      return active ? [active.id] : [];
  };

  const changeRelationship = async (type: 'up' | 'down' | 'left' | 'unlink') => {
      if (!centralNoteId) return;

      const targetIds = getSelectedOrFocusedNotes();
      if (targetIds.length === 0) return;

      // Filter out self
      const validTargets = targetIds.filter(id => id !== centralNoteId);
      if (validTargets.length === 0) return;

      const cleanRelationships = async (centerId: string, targetId: string) => {
        const center = await getNote(centerId);
        const target = await getNote(targetId);
        if (!center || !target) return;

        if (center.linksTo.includes(targetId)) {
            await updateNote(centerId, { linksTo: center.linksTo.filter(id => id !== targetId) });
        }
        if (target.linksTo.includes(centerId)) {
            await updateNote(targetId, { linksTo: target.linksTo.filter(id => id !== centerId) });
        }
        if (center.relatedTo.includes(targetId)) {
            await updateNote(centerId, { relatedTo: center.relatedTo.filter(id => id !== targetId) });
        }
        if (target.relatedTo.includes(centerId)) {
            await updateNote(targetId, { relatedTo: target.relatedTo.filter(id => id !== targetId) });
        }
      };

      for (const id of validTargets) {
          // 1. Unlink existing
          await cleanRelationships(centralNoteId, id);

          // 2. Link new (if not just unlink)
          if (type === 'up') {
            // Target becomes Parent of Center (Target links TO Center)
            const target = await getNote(id);
            if (target) {
                await updateNote(id, { linksTo: [...target.linksTo, centralNoteId] });
            }
          } else if (type === 'down') {
            // Target becomes Child of Center (Center links TO Target)
            const center = await getNote(centralNoteId);
            if (center) {
                await updateNote(centralNoteId, { linksTo: [...center.linksTo, id] });
            }
          } else if (type === 'left') {
            // Lateral
            const center = await getNote(centralNoteId);
            if (center) await updateNote(centralNoteId, { relatedTo: [...center.relatedTo, id] });
            
            const target = await getNote(id);
            if (target) await updateNote(id, { relatedTo: [...target.relatedTo, centralNoteId] });
          }
      }

      loadTopology(centralNoteId);
      setSelectedNoteIds(new Set());
  };

  const handleToggleSelection = (noteId: string) => {
      if (noteId === centralNoteId) return; 
      setSelectedNoteIds(prev => {
          const next = new Set(prev);
          if (next.has(noteId)) {
              next.delete(noteId);
          } else {
              next.add(noteId);
          }
          return next;
      });
  };

  const handleLinkerSelect = async (targetId: string | null, newTitle?: string) => {
    // Determine Anchor: Use focused note if available, otherwise central note
    // This allows linking TO any focused note, not just the central one
    const focusedNote = getFocusedNote();
    const anchorId = focusedNote ? focusedNote.id : centralNoteId;
    
    if (!anchorId) return;

    const cleanRelationships = async (centerId: string, targetId: string) => {
        const center = await getNote(centerId);
        const target = await getNote(targetId);
        if (!center || !target) return;
        if (center.linksTo.includes(targetId)) {
            await updateNote(centerId, { linksTo: center.linksTo.filter(id => id !== targetId) });
        }
        if (target.linksTo.includes(centerId)) {
            await updateNote(targetId, { linksTo: target.linksTo.filter(id => id !== centerId) });
        }
        if (center.relatedTo.includes(targetId)) {
            await updateNote(centerId, { relatedTo: center.relatedTo.filter(id => id !== targetId) });
        }
        if (target.relatedTo.includes(centerId)) {
            await updateNote(targetId, { relatedTo: target.relatedTo.filter(id => id !== targetId) });
        }
    };
    
    const linkToTarget = async (id: string) => {
        await cleanRelationships(anchorId, id);
        
        if (linkerType === 'up') {
            // Target becomes Parent of Anchor (Target links TO Anchor)
            const target = await getNote(id);
            if (target) await updateNote(id, { linksTo: [...target.linksTo, anchorId] });
        } else if (linkerType === 'down') {
            // Target becomes Child of Anchor (Anchor links TO Target)
            const anchor = await getNote(anchorId);
            if (anchor) await updateNote(anchorId, { linksTo: [...anchor.linksTo, id] });
        } else if (linkerType === 'left') {
            // Lateral
            const anchor = await getNote(anchorId);
            if (anchor) await updateNote(anchorId, { relatedTo: [...anchor.relatedTo, id] });
            const target = await getNote(id);
            if (target) await updateNote(id, { relatedTo: [...target.relatedTo, anchorId] });
        }
    };

    if (!targetId && newTitle) {
        if (newTitle.includes(';')) {
            const titles = newTitle.split(';').map(t => t.trim()).filter(t => t.length > 0);
            for (const title of titles) {
                const newNote = await createNote(title);
                await linkToTarget(newNote.id);
            }
        } else {
            const newNote = await createNote(newTitle);
            await linkToTarget(newNote.id);
        }
    } else if (targetId) {
        await linkToTarget(targetId);
    }

    // Always reload center to reflect potential changes in view
    if (centralNoteId) loadTopology(centralNoteId);
    updateTotalCount();
  };

  // Wrapper for Top Bar Buttons
  const handleLinkButtonAction = (type: 'up' | 'down' | 'left') => {
      // If items are selected, we perform the "Move" logic (Relative to Center)
      if (selectedNoteIdsRef.current.size > 0) {
          changeRelationship(type);
      } else {
          // If no selection, we perform the "Add Link" logic (Relative to Focused Note)
          setLinkerType(type);
          setLinkerOpen(true);
      }
  };

  const handleSearchSelect = (id: string) => {
    visit(id);
    setIsSearchActive(false);
    setSearchQuery('');
  };

  const exportData = async () => {
    const notes = await getAllNotes();
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    a.download = `JaRoetPKM_${getCurrentVaultName()}_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMainMenu(false);
  };

  // Trigger file selection, then process contents for Modal
  const importData = () => {
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
                
                // Instead of immediately importing, we set state and open Modal
                setPendingImportData(notes);
                setImportModalOpen(true);
                
                document.body.removeChild(input);
            } catch (err) {
                console.error(err);
                alert('Error parsing file.');
                if (document.body.contains(input)) document.body.removeChild(input);
            }
        };
        reader.readAsText(file);
      } else {
        if (document.body.contains(input)) document.body.removeChild(input);
      }
    };
    input.click();
    setShowMainMenu(false);
  };

  const handleConfirmImport = async (mode: 'overwrite' | 'merge') => {
      setImportModalOpen(false);
      try {
          await importNotes(pendingImportData, mode);
          // Reload to refresh DB connection and state
          setTimeout(() => {
              window.location.reload();
          }, 500);
      } catch (e) {
          console.error(e);
          alert("Import failed. See console for details.");
      }
  };

  const handleGlobalKeyDown = useCallback(async (e: KeyboardEvent) => {
    // ESC handling
    if (e.key === 'Escape') {
        let closed = false;
        if (calendarOpen) {
            setCalendarOpen(false);
            closed = true;
        }
        if (showFavDropdown) {
            setShowFavDropdown(false);
            closed = true;
        }
        if (showMainMenu) {
            setShowMainMenu(false);
            closed = true;
        }
        if (selectedNoteIdsRef.current.size > 0) {
            setSelectedNoteIds(new Set());
            closed = true;
        }
        if (closed) {
            // Also focus center if we just closed something overlay
            if (selectedNoteIdsRef.current.size === 0) {
                setFocusedSection('center');
                setFocusedIndex(0);
            }
            e.preventDefault();
            return;
        }
    }

    if (renameModalOpen || isSearchActive || editorOpen || linkerOpen || settingsOpen || importModalOpen) return;

    // History Navigation (Alt + Arrows)
    if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        back();
        return;
    }
    if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        forward();
        return;
    }

    // Search
    if (e.key === '/') {
      e.preventDefault();
      setIsSearchActive(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
      return;
    }
    
    // Journal Mode (Ctrl+J)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        handleJournalToday();
        return;
    }

    // Toggle Selection (x)
    if (e.key === 'x') {
        e.preventDefault();
        const note = getFocusedNote();
        if (note && note.id !== centralNoteId) {
            handleToggleSelection(note.id);
            // Automatically move to the next note for rapid selection
            const notes = getSortedNotes(focusedSection);
            if (focusedIndex < notes.length - 1) {
                setFocusedIndex(prev => prev + 1);
            }
        }
        return;
    }

    // Deletion
    if (e.ctrlKey && e.key === 'Backspace') {
        e.preventDefault();
        await handleDeleteAction();
        return;
    }

    // Backspace (Unlink)
    if (e.key === 'Backspace') {
      e.preventDefault();
      // If items selected, unlink them
      if (selectedNoteIdsRef.current.size > 0) {
          await changeRelationship('unlink');
          return;
      }
      // If focused item, unlink it
      const note = getFocusedNote();
      if (note && centralNoteId && focusedSection !== 'center' && focusedSection !== 'right' && focusedSection !== 'favs' && focusedSection !== 'content') {
        await changeRelationship('unlink');
        loadTopology(centralNoteId);
      }
      return;
    }

    // Linking Shortcuts (Ctrl + Arrows)
    if (e.ctrlKey) {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (selectedNoteIdsRef.current.size > 0) {
                await changeRelationship('up');
            } else {
                setLinkerType('up');
                setLinkerOpen(true);
            }
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (selectedNoteIdsRef.current.size > 0) {
                await changeRelationship('down');
            } else {
                setLinkerType('down');
                setLinkerOpen(true);
            }
            return;
        }
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (selectedNoteIdsRef.current.size > 0) {
                await changeRelationship('left');
            } else {
                setLinkerType('left');
                setLinkerOpen(true);
            }
            return;
        }
    }

    // F2 Rename
    if (e.key === 'F2') {
        e.preventDefault();
        handleStartRename();
        return;
    }

    // Shift+Enter (View Mode)
    if (e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        handleOpenEditor('view');
        return;
    }

    // Ctrl+Enter: Open Editor in Edit Mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleOpenEditor('edit');
        return;
    }

    // Enter = Focus Center
    if (e.key === 'Enter') { 
        e.preventDefault();
        setFocusedSection('center');
        return;
    }

    // Space = Open Note
    if (e.key === ' ') {
        e.preventDefault();
        const note = getFocusedNote();
        if (note && note.id !== centralNoteId) {
            visit(note.id);
        }
        return;
    }

    // --- NAVIGATION LOGIC ---
    
    // Helper to estimate columns for grid navigation
    const getItemsPerColumn = (sectionId: string) => {
        const container = document.getElementById(sectionId);
        if (!container) return 1;
        
        // This is a rough estimation for "masonry/flex-wrap" behavior
        // We look at the left offset of the second item vs first item
        const cards = Array.from(container.children).filter(c => c.id.startsWith('note-'));
        if (cards.length < 2) return 1;
        
        const firstLeft = (cards[0] as HTMLElement).offsetLeft;
        
        // Find first element that is in a new column (further right)
        for (let i = 1; i < cards.length; i++) {
            const currentLeft = (cards[i] as HTMLElement).offsetLeft;
            if (currentLeft > firstLeft + 20) {
                // Found a column break? 
                // Actually, if flex-direction is column and it wraps, items go down then right.
                // So index i is the start of the second column.
                // Thus items per column is i.
                return i;
            }
        }
        return cards.length;
    };

    if (e.key === 'ArrowUp') {
        e.preventDefault();
        
        // Selection Extension (Shift+Up)
        if (e.shiftKey && ['up', 'down', 'left', 'right', 'favs'].includes(focusedSection)) {
             const notes = getSortedNotes(focusedSection);
             if (notes.length === 0) return;
             
             // If nothing selected, select current
             if (selectedNoteIds.size === 0) {
                 const current = notes[focusedIndex];
                 if (current) handleToggleSelection(current.id);
             }
             
             // Move selection up
             if (focusedIndex > 0) {
                 const newIndex = focusedIndex - 1;
                 setFocusedIndex(newIndex);
                 const target = notes[newIndex];
                 if (target) {
                     setSelectedNoteIds(prev => {
                         const next = new Set(prev);
                         next.add(target.id); 
                         return next;
             });
                 }
             }
             return;
        }

        if (focusedSection === 'content') {
             setFocusedSection('right');
             setFocusedIndex(Math.min(sectionIndices.right, topology.righters.length - 1));
             return;
        }

        if (focusedSection === 'center') {
            if (topology.uppers.length > 0) {
                setFocusedSection('up');
                const target = Math.min(sectionIndices.up, topology.uppers.length - 1);
                setFocusedIndex(target);
            }
        } else if (focusedSection === 'down') {
             if (focusedIndex === 0) {
                setFocusedSection('center');
             } else {
                 setFocusedIndex(prev => Math.max(0, prev - 1));
             }
        } else if (focusedSection === 'favs') {
            if (focusedIndex === 0) {
                setFocusedSection('left');
                const target = Math.min(sectionIndices.left, topology.lefters.length - 1);
                setFocusedIndex(target);
            } else {
                setFocusedIndex(prev => Math.max(0, prev - 1));
            }
        } else {
            // General List Up
            setFocusedIndex(prev => Math.max(0, prev - 1));
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        
        // Selection Extension (Shift+Down)
        if (e.shiftKey && ['up', 'down', 'left', 'right', 'favs'].includes(focusedSection)) {
             const notes = getSortedNotes(focusedSection);
             if (notes.length === 0) return;
             
             if (selectedNoteIds.size === 0) {
                 const current = notes[focusedIndex];
                 if (current) handleToggleSelection(current.id);
             }
             
             if (focusedIndex < notes.length - 1) {
                 const newIndex = focusedIndex + 1;
                 setFocusedIndex(newIndex);
                 const target = notes[newIndex];
                 if (target) {
                     setSelectedNoteIds(prev => {
                         const next = new Set(prev);
                         next.add(target.id);
                         return next;
                     });
                 }
             }
             return;
        }

        if (focusedSection === 'content') return;
        
        if (focusedSection === 'center') {
             if (topology.downers.length > 0) {
                setFocusedSection('down');
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
        } else if (focusedSection === 'left') {
             const arr = topology.lefters;
             if (focusedIndex === arr.length - 1) {
                 if (showFavorites && favorites.length > 0) {
                    setFocusedSection('favs');
                    setFocusedIndex(Math.min(sectionIndices.favs, favorites.length - 1));
                 }
             } else {
                 setFocusedIndex(prev => Math.min(arr.length - 1, prev + 1));
             }
        } else if (focusedSection === 'right') {
             const arr = topology.righters;
             if (focusedIndex === arr.length - 1) {
                 if (showContent) {
                     setFocusedSection('content');
                 }
             } else {
                 setFocusedIndex(prev => Math.min(arr.length - 1, prev + 1));
             }
        } else {
            const arr = getSortedNotes(focusedSection);
            setFocusedIndex(prev => Math.min(arr.length - 1, prev + 1));
        }
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        
        // Handle Intra-Section Column Navigation (Left)
        if (['up', 'down', 'left', 'right', 'favs'].includes(focusedSection)) {
             const containerId = `container-${focusedSection}`;
             const itemsPerCol = getItemsPerColumn(containerId);
             
             // Move left one column (subtract column height)
             const newIndex = focusedIndex - itemsPerCol;
             
             if (newIndex >= 0) {
                 setFocusedIndex(newIndex);
                 return; // Stay in section, just moved column left
             }
             // If < 0, fall through to section switch logic
        }

        if (focusedSection === 'content') {
             setFocusedSection('down');
             setFocusedIndex(Math.min(sectionIndices.down, topology.downers.length - 1));
             return;
        }

        if (focusedSection === 'center') {
            if (topology.lefters.length > 0) {
                setFocusedSection('left');
                const target = Math.min(sectionIndices.left, topology.lefters.length - 1);
                setFocusedIndex(target);
            } else if (showFavorites && favorites.length > 0) {
                 setFocusedSection('favs');
                 const target = Math.min(sectionIndices.favs, favorites.length - 1);
                 setFocusedIndex(target);
            }
        } else if (focusedSection === 'right') {
             setFocusedSection('up');
             setFocusedIndex(Math.min(sectionIndices.up, topology.uppers.length - 1));
        } else if (focusedSection === 'down') {
             if (showFavorites && favorites.length > 0) {
                 setFocusedSection('favs');
                 setFocusedIndex(Math.min(sectionIndices.favs, favorites.length - 1));
             } else {
                 setFocusedSection('left');
                 setFocusedIndex(Math.min(sectionIndices.left, topology.lefters.length - 1));
             }
        } else if (focusedSection === 'up') {
            setFocusedSection('left');
            setFocusedIndex(Math.min(sectionIndices.left, topology.lefters.length - 1));
        }
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();

        // Handle Intra-Section Column Navigation (Right)
        if (['up', 'down', 'left', 'right', 'favs'].includes(focusedSection)) {
             const containerId = `container-${focusedSection}`;
             const itemsPerCol = getItemsPerColumn(containerId);
             const notes = getSortedNotes(focusedSection);
             
             const newIndex = focusedIndex + itemsPerCol;
             
             if (newIndex < notes.length) {
                 setFocusedIndex(newIndex);
                 return; // Stay in section, just moved column right
             }
             // If >= length, fall through to section switch logic
        }

        if (focusedSection === 'content') return;

        if (focusedSection === 'center') {
            if (topology.righters.length > 0) {
                setFocusedSection('right');
                const target = Math.min(sectionIndices.right, topology.righters.length - 1);
                setFocusedIndex(target);
            } else {
                setFocusedSection('content');
            }
        } else if (focusedSection === 'left') {
            setFocusedSection('up'); 
            setFocusedIndex(Math.min(sectionIndices.up, topology.uppers.length - 1));
        } else if (focusedSection === 'favs') {
            setFocusedSection('down'); 
            setFocusedIndex(Math.min(sectionIndices.down, topology.downers.length - 1));
        } else if (focusedSection === 'up') {
             setFocusedSection('right');
             setFocusedIndex(Math.min(sectionIndices.right, topology.righters.length - 1));
        } else if (focusedSection === 'down') {
             if (showContent) {
                setFocusedSection('content');
             } else if (topology.righters.length > 0) {
                setFocusedSection('right');
                setFocusedIndex(Math.min(sectionIndices.right, topology.righters.length - 1));
             }
        } 
    }

  }, [focusedSection, focusedIndex, topology, favorites, centralNoteId, renameModalOpen, isSearchActive, editorOpen, linkerOpen, settingsOpen, fontSize, sectionIndices, getFocusedNote, getSortedNotes, showFavDropdown, showMainMenu, selectedNoteIds, showFavorites, showContent, handleDeleteAction, importModalOpen, calendarOpen, back, forward]);

  // Robust Event Listener Attachment
  const handleKeyDownRef = useRef(handleGlobalKeyDown);
  
  useEffect(() => {
    handleKeyDownRef.current = handleGlobalKeyDown;
  }, [handleGlobalKeyDown]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => handleKeyDownRef.current(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
          
  const labelStyle = "absolute -top-[5px] left-6 px-3 py-0.5 font-bold tracking-wider bg-[var(--theme-section)] text-[color-mix(in_srgb,var(--theme-accent)_50%,transparent)] select-none z-20 pointer-events-none rounded-full border border-black/10 dark:border-white/10";
  const uiFontSize = Math.max(14, fontSize - 4);
  const activeNote = getFocusedNote();
  const activeNoteHasContent = activeNote?.content && activeNote.content.trim().length > 0;
  const hasSelection = selectedNoteIds.size > 0;
  const canUnlink = hasSelection || (focusedSection !== 'center' && focusedSection !== 'content' && focusedSection !== 'right' && focusedSection !== 'favs');

  const centerSubtitle = topology.center ? getDateSubtitle(topology.center.title) : null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
      <style>{compactMarkdownStyles}</style>

      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Top Bar - Compacted */}
        <div 
            style={{ fontSize: `${uiFontSize}px` }} 
            className="h-12 flex-shrink-0 flex items-center px-2 gap-1 z-40 shadow-md relative bg-[var(--theme-bars)] text-foreground transition-colors duration-300"
        >
            
            {/* Left Group: Menu, Home, Favorites List */}
            <div className="flex items-center gap-1">
                
                {/* Main Menu (Hamburger) */}
                <div className="relative">
                    <button 
                        onClick={() => setShowMainMenu(!showMainMenu)} 
                        title="Main Menu"
                        className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        style={{ color: 'var(--theme-accent)' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                    {showMainMenu && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-card text-foreground border border-gray-200 dark:border-gray-700 shadow-xl rounded-md z-50 flex flex-col py-2">
                             
                             {/* Vault Switcher Accordion */}
                             <div className="border-b border-gray-100 dark:border-gray-800 mb-1 pb-1">
                                <button 
                                    onClick={() => setShowVaultListInMenu(!showVaultListInMenu)}
                                    className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between gap-3 text-sm text-foreground"
                                >
                                    <div className="flex items-center gap-3">
                                        <svg className="text-primary" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
                                        <span>Vault: <span className="font-bold">{getCurrentVaultName()}</span></span>
                                    </div>
                                    <span className={`transform transition-transform ${showVaultListInMenu ? 'rotate-180' : ''}`}>▼</span>
                                </button>
                                {showVaultListInMenu && (
                                    <div className="bg-gray-50 dark:bg-zinc-900 border-y border-gray-100 dark:border-gray-800">
                                        {getVaultList().map(v => (
                                            <div 
                                                key={v}
                                                className={`px-8 py-2 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer text-sm flex justify-between items-center ${
                                                    v === getCurrentVaultName() ? 'text-primary font-bold' : 'text-gray-500'
                                                }`}
                                                onClick={() => {
                                                    switchVault(v);
                                                    setShowMainMenu(false);
                                                }}
                                            >
                                                <span className="truncate">{v}</span>
                                                {v === getCurrentVaultName() && <span>•</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                             </div>

                             {/* Theme Switcher */}
                             <button 
                                onClick={() => { setIsDarkMode(!isDarkMode); setShowMainMenu(false); }}
                                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3 text-sm text-foreground"
                             >
                                <span className="w-5 flex justify-center text-primary">
                                    {isDarkMode ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                                    )}
                                </span>
                                <span>Switch Theme</span>
                     </button>

                     {/* Settings */}
                     <button 
                        onClick={() => { setSettingsOpen(true); setShowMainMenu(false); }}
                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3 text-sm text-foreground"
                     >
                        <svg className="text-primary" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        <span>Settings</span>
                     </button>

                     {/* Export */}
                     <button 
                        onClick={() => { exportData(); setShowMainMenu(false); }}
                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3 text-sm text-foreground"
                     >
                        <svg className="text-primary" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2 2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        <span>Export Data</span>
                     </button>

                     {/* Import */}
                     <button 
                        onClick={() => { importData(); setShowMainMenu(false); }}
                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3 text-sm text-foreground"
                     >
                        <svg className="text-primary" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        <span>Import Data</span>
                     </button>
                </div>
            )}
        </div>

        {/* Navigation History */}
        <div className="flex items-center gap-0.5">
            <button
                onClick={() => back()}
                disabled={!canBack}
                title="Back (Alt + Left)"
                className={`p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${!canBack ? 'opacity-30 cursor-not-allowed' : ''}`}
                style={{ color: 'var(--theme-accent)' }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button
                onClick={() => forward()}
                disabled={!canForward}
                title="Forward (Alt + Right)"
                className={`p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${!canForward ? 'opacity-30 cursor-not-allowed' : ''}`}
                style={{ color: 'var(--theme-accent)' }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
        </div>

        <button 
            onClick={goHome} 
            title="Go Home" 
            className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--theme-accent)' }}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        </button>

        {/* Calendar / Journal Dropdown */}
        <div className="relative">
            <button 
                onClick={() => setCalendarOpen(!calendarOpen)} 
                title="Journal / Calendar (Ctrl+J)" 
                className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                style={{ color: 'var(--theme-accent)' }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </button>
            <CalendarDropdown 
                isOpen={calendarOpen}
                onClose={() => setCalendarOpen(false)}
                onSelectDate={handleCalendarSelect}
                existingDates={existingJournalDates}
                onMonthChange={handleCalendarMonthChange}
            />
        </div>

         {/* Favorites Dropdown */}
         <div className="relative">
            <button 
                title="Favorites List"
                onClick={() => setShowFavDropdown(!showFavDropdown)} 
                className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                style={{ color: 'var(--theme-accent)' }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <g transform="translate(-1, 7) scale(0.4)">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </g>
                    <g transform="translate(7, 7) scale(0.4)">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </g>
                    <g transform="translate(15, 7) scale(0.4)">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </g>
                </svg>
            </button>
            {showFavDropdown && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-card text-foreground border border-gray-200 dark:border-gray-700 shadow-xl rounded-md z-50 max-h-80 overflow-y-auto">
                    <div className="p-2 font-bold text-xs uppercase text-gray-500 border-b dark:border-gray-700">Favorites</div>
                    {favorites.length === 0 && <div className="p-3 text-sm text-gray-500 italic text-center">No favorites yet</div>}
                    {favorites.map(fav => (
                        <div 
                            key={fav.id}
                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm truncate"
                            onClick={() => {
                                visit(fav.id);
                                setShowFavDropdown(false);
                            }}
                        >
                            {fav.title}
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>

    {/* Separator 1 */}
    <div className="h-6 w-px bg-current opacity-20 mx-0.5"></div>

    {/* Center Group: Note Actions */}
     <div className="flex items-center gap-1">
        <button 
            title="Toggle Favorite (Current Note)"
            onClick={handleFavoriteToggle} 
            className={`p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${
                activeNote?.isFavorite 
                    ? '' 
                    : 'text-gray-400'
            }`}
            style={activeNote?.isFavorite ? { color: 'var(--theme-accent)' } : {}}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={activeNote?.isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        </button>
        <button 
            onClick={() => handleOpenEditor('view')} 
            title="View Content (Shift+Enter)" 
            className={`p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${
                activeNoteHasContent 
                    ? '' 
                    : 'text-gray-400'
            }`}
            style={activeNoteHasContent ? { color: 'var(--theme-accent)' } : {}}
        >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={activeNoteHasContent ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        </button>
        <button 
            onClick={handleStartRename} 
            title="Rename Note (F2)" 
            className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--theme-accent)' }}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button 
            type="button" 
            onClick={handleDeleteAction} 
            title="Delete Note (Ctrl+Backspace)" 
            className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--theme-accent)' }}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </button>
    </div>

    {/* Separator 2 */}
    <div className="h-6 w-px bg-current opacity-20 mx-0.5"></div>

     {/* Linking Tools */}
     <div className="flex items-center gap-1">
        <button 
            onClick={() => changeRelationship('unlink')}
            disabled={!canUnlink}
            title="Unlink Selected/Focused Note (Backspace)" 
            className={`p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${!canUnlink ? 'opacity-30 cursor-not-allowed' : ''}`}
            style={{ color: 'var(--theme-accent)' }}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
        </button>
        <button 
            onClick={() => handleLinkButtonAction('left')}
            title="Link as Related (Ctrl+Left)" 
            className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--theme-accent)' }}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <button 
            onClick={() => handleLinkButtonAction('up')}
            title="Link as Parent (Ctrl+Up)" 
            className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--theme-accent)' }}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
        </button>
        <button 
            onClick={() => handleLinkButtonAction('down')}
            title="Link as Child (Ctrl+Down)" 
            className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--theme-accent)' }}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
        </button>
     </div>

     {/* Separator 3 */}
     <div className="h-6 w-px bg-current opacity-20 mx-0.5"></div>

    {/* Right: Search (Fill) */}
    <div className="relative flex-1">
        <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Search (Press /)" 
            className="w-full bg-black/5 dark:bg-black/20 text-foreground placeholder-gray-500 dark:placeholder-white/40 rounded-md px-3 py-1.5 outline-none transition-all border border-transparent focus:bg-black/10 dark:focus:bg-black/30"
            style={{ fontSize: 'inherit', borderColor: 'var(--theme-accent)' }}
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
                    e.stopPropagation(); // Stop global handlers
                    // Fix: Directly use index instead of complex logic
                    const selected = searchResults[activeSearchIndex];
                    if (selected) {
                        handleSearchSelect(selected.id);
                        searchInputRef.current?.blur();
                    }
                }
            }}
        />
        {isSearchActive && searchResults.length > 0 && (
            <div ref={searchResultsRef} className="absolute top-full left-0 right-0 bg-card text-foreground border border-gray-200 dark:border-gray-700 shadow-xl rounded-b-md mt-1 z-50 max-h-96 overflow-y-auto">
                {searchResults.map((res, idx) => (
                    <div 
                        key={res.id} 
                        className={`px-4 py-2 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0 text-sm ${
                            idx === activeSearchIndex ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/10'
                        }`}
                        onClick={() => handleSearchSelect(res.id)}
                        onMouseEnter={() => setActiveSearchIndex(idx)}
                    >
                        {res.title}
                    </div>
                ))}
            </div>
        )}
    </div>

</div>

{/* Canvas Area - 3-COLUMN FLEX LAYOUT */}
<div 
    ref={mainContainerRef}
    className="flex-1 bg-[var(--theme-bg)] p-3 overflow-hidden outline-none relative transition-colors duration-300" 
    tabIndex={0}
>
    <div className="flex h-full w-full gap-3">
        
        {/* --- Left Column (25%) --- */}
        <div className="flex flex-col gap-3 w-1/4">
            
            {/* Related (Top Left) */}
            <div className={`${showFavorites ? 'flex-1' : 'h-full'} relative bg-[var(--theme-section)] rounded-3xl shadow-lg border border-black/5 dark:border-white/5 min-h-0`}>
                <div className={labelStyle} style={{ fontSize: `${Math.max(10, fontSize - 10)}px` }}>Related</div>
                <NoteSection
                    notes={topology.lefters}
                    section="left"
                    containerClasses="absolute inset-0 flex flex-col gap-0 overflow-y-auto p-3 custom-scrollbar rounded-3xl pt-6"
                    itemClasses="w-full"
                    containerId="container-left"
                    fontSize={fontSize}
                    focusedSection={focusedSection}
                    focusedIndex={focusedIndex}
                    selectedNoteIds={selectedNoteIds}
                    centralNoteId={centralNoteId}
                    onNoteClick={(id, isCtrl) => {
                        if (isCtrl) {
                            handleToggleSelection(id);
                        } else {
                            if (id !== centralNoteId) visit(id);
                        }
                    }}
                    scrollPositionsRef={scrollPositionsRef}
                />
            </div>

            {/* Favorites (Bottom Left) - Conditional */}
            {showFavorites && (
                <div className="flex-1 relative bg-[var(--theme-section)] rounded-3xl shadow-lg border border-black/5 dark:border-white/5 min-h-0">
                    <div className={labelStyle} style={{ fontSize: `${Math.max(10, fontSize - 10)}px` }}>Favorites</div>
                    <NoteSection
                        notes={favorites}
                        section="favs"
                        containerClasses="absolute inset-0 flex flex-col gap-0 overflow-y-auto p-3 custom-scrollbar rounded-3xl pt-6"
                        itemClasses="w-full"
                        containerId="container-favs"
                        fontSize={fontSize}
                        focusedSection={focusedSection}
                        focusedIndex={focusedIndex}
                        selectedNoteIds={selectedNoteIds}
                        centralNoteId={centralNoteId}
                        onNoteClick={(id, isCtrl) => {
                            if (isCtrl) {
                                handleToggleSelection(id);
                            } else {
                                if (id !== centralNoteId) visit(id);
                            }
                        }}
                        scrollPositionsRef={scrollPositionsRef}
                    />
                </div>
            )}
        </div>

        {/* --- Center Column (50%) --- */}
        <div className="flex flex-col gap-3 w-1/2">
            
            {/* Top Wrapper (Parents + Active) - flex-1 matches side columns' top section */}
            <div className="flex-1 flex flex-col gap-3 min-h-0">
                
                {/* Parents (35% of column ~ 70% of wrapper) */}
                <div className="flex-[7] relative bg-[var(--theme-section)] rounded-3xl shadow-lg border border-black/5 dark:border-white/5 min-h-0">
                     <div className={labelStyle} style={{ fontSize: `${Math.max(10, fontSize - 10)}px` }}>Parents</div>
                     <div className="absolute inset-0 overflow-x-auto overflow-y-hidden custom-scrollbar rounded-3xl pt-6">
                        <NoteSection
                            notes={topology.uppers}
                            section="up"
                            containerClasses="h-full w-fit flex flex-col flex-wrap content-start gap-0 p-3 mx-auto"
                            itemClasses="w-[300px] flex-shrink-0"
                            containerId="container-up"
                            fontSize={fontSize}
                            focusedSection={focusedSection}
                            focusedIndex={focusedIndex}
                            selectedNoteIds={selectedNoteIds}
                            centralNoteId={centralNoteId}
                            onNoteClick={(id, isCtrl) => {
                                if (isCtrl) {
                                    handleToggleSelection(id);
                                } else {
                                    if (id !== centralNoteId) visit(id);
                                }
                            }}
                            scrollPositionsRef={scrollPositionsRef}
                        />
                     </div>
                </div>

                {/* Active Note (15% of column ~ 30% of wrapper) */}
                <div className="flex-[3] relative flex items-center justify-center p-4 z-10 bg-[var(--theme-section)] rounded-3xl shadow-lg border border-black/5 dark:border-white/5 min-h-0">
                    <div className={labelStyle} style={{ fontSize: `${Math.max(10, fontSize - 10)}px` }}>Active Note</div>
                    {topology.center && (
                        <>
                            <NoteCard
                                note={topology.center}
                                fontSize={fontSize}
                                isFocused={focusedSection === 'center'}
                                isCenter={true}
                                onClick={() => {}}
                                subtitle={centerSubtitle}
                            />
                            {/* Status Icons (Moved to Section Container) */}
                            <div className="absolute bottom-4 right-4 flex gap-1 pointer-events-none">
                                {topology.center.isFavorite && (
                                    <svg className="text-yellow-600 drop-shadow-sm" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                )}
                                {topology.center.content && topology.center.content.trim().length > 0 && (
                                    <svg className="text-yellow-600 drop-shadow-sm" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Children (Bot Center - 50%) */}
            <div className="flex-1 relative bg-[var(--theme-section)] rounded-3xl shadow-lg border border-black/5 dark:border-white/5 min-h-0">
                <div className={labelStyle} style={{ fontSize: `${Math.max(10, fontSize - 10)}px` }}>Children</div>
                <div className="absolute inset-0 overflow-x-auto overflow-y-hidden custom-scrollbar rounded-3xl pt-6">
                    <NoteSection
                        notes={topology.downers}
                        section="down"
                        containerClasses="h-full w-fit flex flex-col flex-wrap content-start gap-0 p-3 mx-auto"
                        itemClasses="w-[300px] flex-shrink-0"
                        containerId="container-down"
                        fontSize={fontSize}
                        focusedSection={focusedSection}
                        focusedIndex={focusedIndex}
                        selectedNoteIds={selectedNoteIds}
                        centralNoteId={centralNoteId}
                        onNoteClick={(id, isCtrl) => {
                            if (isCtrl) {
                                handleToggleSelection(id);
                            } else {
                                if (id !== centralNoteId) visit(id);
                            }
                        }}
                        scrollPositionsRef={scrollPositionsRef}
                    />
                </div>
            </div>
        </div>

        {/* --- Right Column (25%) --- */}
        <div className="flex flex-col gap-3 w-1/4">
            
            {/* Siblings (Top Right) */}
            <div className={`${showContent ? 'flex-1' : 'h-full'} relative bg-[var(--theme-section)] rounded-3xl shadow-lg border border-black/5 dark:border-white/5 min-h-0`}>
                <div className={labelStyle} style={{ fontSize: `${Math.max(10, fontSize - 10)}px` }}>Siblings</div>
                 <NoteSection
                    notes={topology.righters}
                    section="right"
                    containerClasses="flex flex-col gap-0 overflow-y-auto p-3 h-full custom-scrollbar rounded-3xl pt-6"
                    itemClasses="w-full"
                    containerId="container-right"
                    fontSize={fontSize}
                    focusedSection={focusedSection}
                    focusedIndex={focusedIndex}
                    selectedNoteIds={selectedNoteIds}
                    centralNoteId={centralNoteId}
                    onNoteClick={(id, isCtrl) => {
                        if (isCtrl) {
                            handleToggleSelection(id);
                        } else {
                            if (id !== centralNoteId) visit(id);
                        }
                    }}
                    scrollPositionsRef={scrollPositionsRef}
                />
            </div>

            {/* Content Preview (Bottom Right) - Conditional */}
            {showContent && (
                <div 
                    ref={contentPreviewRef}
                    onClick={handleCanvasContentClick}
                    className={`flex-1 relative bg-[var(--theme-section)] rounded-3xl shadow-lg border border-black/5 dark:border-white/5 min-h-0 outline-none ${focusedSection === 'content' ? 'ring-2 ring-[var(--theme-accent)]' : ''}`}
                    tabIndex={-1}
                >
                     <div className={labelStyle} style={{ fontSize: `${Math.max(10, fontSize - 10)}px` }}>Content</div>
                     <div 
                        className="absolute inset-0 p-6 overflow-auto custom-scrollbar prose dark:prose-invert max-w-none rounded-3xl pt-8 compact-markdown"
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                     />
                </div>
            )}
        </div>

    </div>
</div>

{/* --- Footer / Status Bar --- */}
<div style={{ fontSize: `${uiFontSize}px` }} className="h-8 flex-shrink-0 bg-[var(--theme-bars)] flex items-center justify-between px-4 text-foreground z-50 transition-colors duration-300">
    <div className="flex-shrink-0 opacity-90">
        Notes: {totalNoteCount} | DB: {getCurrentVaultName()} 0.3.5
    </div>
    <div className="opacity-60 truncate ml-4 text-right">
        Arrows: Nav | Space: Open | Enter: Center Focus | Shift+Enter: Edit | Ctrl+Arrows: Link | F2: Rename | Bksp: Unlink
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
initialMode={editorMode}
note={getFocusedNote()}
onClose={() => setEditorOpen(false)}
onSave={(id, content) => {
    updateNote(id, { content });
    loadTopology(centralNoteId!);
}}
onInternalLinkClick={handleInternalLinkClick}
/>
<RenameModal
isOpen={renameModalOpen}
currentTitle={noteToRename?.title || ''}
onClose={() => setRenameModalOpen(false)}
onRename={handleRename}
/>
<SettingsModal
isOpen={settingsOpen}
onClose={() => setSettingsOpen(false)}
currentCentralNoteId={centralNoteId}
fontSize={fontSize}
onFontSizeChange={setFontSize}
onThemeChange={() => setThemeTick(t => t + 1)}
onSettingsChange={refreshSettings}
/>
<ImportModal 
isOpen={importModalOpen}
importData={pendingImportData}
onClose={() => setImportModalOpen(false)}
onConfirm={handleConfirmImport}
/>
</div>
);
}

export default App;
