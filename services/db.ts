import Dexie, { Table } from 'dexie';
import { Note, Topology, SearchResult } from '../types';

// --- Vault Management ---

const VAULT_LIST_KEY = 'nexusnode_vaults';
const CURRENT_VAULT_KEY = 'nexusnode_current_vault';
const DEFAULT_VAULT = 'NexusNodeDB';

// Initialize Vault configuration if missing
if (!localStorage.getItem(VAULT_LIST_KEY)) {
    localStorage.setItem(VAULT_LIST_KEY, JSON.stringify([DEFAULT_VAULT]));
}
if (!localStorage.getItem(CURRENT_VAULT_KEY)) {
    localStorage.setItem(CURRENT_VAULT_KEY, DEFAULT_VAULT);
}

export const getVaultList = (): string[] => {
    try {
        return JSON.parse(localStorage.getItem(VAULT_LIST_KEY) || '[]');
    } catch {
        return [DEFAULT_VAULT];
    }
};

export const getCurrentVaultName = (): string => {
    return localStorage.getItem(CURRENT_VAULT_KEY) || DEFAULT_VAULT;
};

// --- Database Class ---

// Extend Dexie
class PKMDatabase extends Dexie {
  notes!: Table<Note, string>;
  meta!: Table<{ key: string; value: any }, string>;

  constructor() {
    super(getCurrentVaultName());
    (this as any).version(1).stores({
      notes: 'id, title, *linksTo, *relatedTo', // Indexes required by prompt
      meta: 'key',
    });
  }
}

export const db = new PKMDatabase();

// --- Vault Operations ---

export const switchVault = (name: string) => {
    if (getVaultList().includes(name)) {
        localStorage.setItem(CURRENT_VAULT_KEY, name);
        window.location.reload();
    }
};

export const createVault = (name: string) => {
    const list = getVaultList();
    const sanitizedName = name.trim();
    if (sanitizedName && !list.includes(sanitizedName)) {
        list.push(sanitizedName);
        localStorage.setItem(VAULT_LIST_KEY, JSON.stringify(list));
        localStorage.setItem(CURRENT_VAULT_KEY, sanitizedName); // Auto switch to new
        window.location.reload();
    }
};

export const deleteCurrentVault = async () => {
    const current = getCurrentVaultName();
    
    // Close connection before deletion
    (db as any).close();
    await Dexie.delete(current);
    
    let list = getVaultList();
    list = list.filter(v => v !== current);
    
    // Ensure there is always one vault
    if (list.length === 0) list.push(DEFAULT_VAULT);
    
    localStorage.setItem(VAULT_LIST_KEY, JSON.stringify(list));
    localStorage.setItem(CURRENT_VAULT_KEY, list[0]); // Switch to first available
    window.location.reload();
};

export const resetCurrentVault = async () => {
    // Clear all tables but keep the DB structure
    await (db as any).transaction('rw', db.notes, db.meta, async () => {
        await db.notes.clear();
        await db.meta.clear();
    });
    window.location.reload();
};


// --- Seed Data ---
export const seedDatabase = async () => {
  const count = await db.notes.count();
  if (count === 0) {
    const now = Date.now();
    const n1 = {
      id: crypto.randomUUID(),
      title: 'Welcome to JaRoet PKM',
      content: '# Welcome\n\nThis is your Central Note. Use arrow keys to navigate.',
      linksTo: [],
      relatedTo: [],
      isFavorite: false,
      createdAt: now,
      modifiedAt: now,
    };
    
    await db.notes.bulkAdd([n1]);
    await db.meta.put({ key: 'currentCentralNoteId', value: n1.id });
    await db.meta.put({ key: 'favoritesList', value: [] });
    // Default home note
    await db.meta.put({ key: 'homeNoteId', value: n1.id });
    return n1.id;
  }
  return null;
};

// --- Core Operations ---

export const getNote = async (id: string): Promise<Note | undefined> => {
  return await db.notes.get(id);
};

export const createNote = async (title: string): Promise<Note> => {
  const now = Date.now();
  const note: Note = {
    id: crypto.randomUUID(),
    title,
    content: '',
    linksTo: [],
    relatedTo: [],
    isFavorite: false,
    createdAt: now,
    modifiedAt: now,
  };
  await db.notes.add(note);
  return note;
};

export const updateNote = async (id: string, updates: Partial<Note>) => {
  await db.notes.update(id, { ...updates, modifiedAt: Date.now() });
};

export const deleteNote = async (id: string) => {
    await (db as any).transaction('rw', db.notes, db.meta, async () => {
        // 1. Delete the note itself
        await db.notes.delete(id);

        // 2. Remove references from linksTo (Parent relationships)
        await db.notes.where('linksTo').equals(id).modify((note: Note) => {
            note.linksTo = note.linksTo.filter(linkId => linkId !== id);
            note.modifiedAt = Date.now();
        });

        // 3. Remove references from relatedTo (Lateral relationships)
        await db.notes.where('relatedTo').equals(id).modify((note: Note) => {
            note.relatedTo = note.relatedTo.filter(linkId => linkId !== id);
            note.modifiedAt = Date.now();
        });

        // 4. Remove from favorites list in Meta
        const favsMeta = await db.meta.get('favoritesList');
        if (favsMeta && favsMeta.value.includes(id)) {
            const newFavs = favsMeta.value.filter((favId: string) => favId !== id);
            await db.meta.put({ key: 'favoritesList', value: newFavs });
        }
    });
};

export const getNoteCount = async (): Promise<number> => {
    return await db.notes.count();
};

// --- Topology ---

export const getTopology = async (centerId: string): Promise<Topology> => {
  const center = await db.notes.get(centerId);

  if (!center) {
    // Fallback if center doesn't exist
    return { center: null, uppers: [], downers: [], lefters: [], righters: [] };
  }

  // Uppers: Notes that link TO center via linksTo
  const uppers = await db.notes.where('linksTo').equals(centerId).toArray();

  // Downers: Notes center links TO
  const downers = await db.notes.bulkGet(center.linksTo);

  // Lefters: Notes center relates TO
  const lefters = await db.notes.bulkGet(center.relatedTo);

  // Righters: All Downers of All Uppers (Contextual Siblings), excluding Center
  const rightersMap = new Map<string, Note>();
  
  // We need to fetch downers for all uppers
  // This could be heavy if there are many uppers, but necessary for the definition
  for (const upper of uppers) {
    const siblings = await db.notes.bulkGet(upper.linksTo);
    siblings.forEach(sib => {
      if (sib && sib.id !== centerId) {
        rightersMap.set(sib.id, sib);
      }
    });
  }
  const righters = Array.from(rightersMap.values());

  return {
    center,
    uppers: uppers.filter(Boolean) as Note[],
    downers: downers.filter(Boolean) as Note[],
    lefters: lefters.filter(Boolean) as Note[],
    righters,
  };
};

// --- Favorites (Dedicated Storage) ---

export const getFavorites = async (): Promise<Note[]> => {
  const meta = await db.meta.get('favoritesList');
  const ids: string[] = meta ? meta.value : [];
  const notes = await db.notes.bulkGet(ids);
  return notes.filter(Boolean) as Note[];
};

export const toggleFavorite = async (noteId: string) => {
  await (db as any).transaction('rw', db.notes, db.meta, async () => {
    const note = await db.notes.get(noteId);
    if (!note) return;

    const newStatus = !note.isFavorite;
    await db.notes.update(noteId, { isFavorite: newStatus, modifiedAt: Date.now() });

    const meta = await db.meta.get('favoritesList');
    let ids: string[] = meta ? meta.value : [];

    if (newStatus) {
      if (!ids.includes(noteId)) ids.push(noteId);
    } else {
      ids = ids.filter(id => id !== noteId);
    }
    await db.meta.put({ key: 'favoritesList', value: ids });
  });
};

// --- Home Note ---

export const getHomeNoteId = async (): Promise<string | null> => {
    const meta = await db.meta.get('homeNoteId');
    return meta ? meta.value : null;
};

export const setHomeNoteId = async (id: string) => {
    await db.meta.put({ key: 'homeNoteId', value: id });
};

// --- App Settings (Font Size) ---

export const getFontSize = async (): Promise<number> => {
    const meta = await db.meta.get('fontSize');
    return meta ? meta.value : 16; // Default 16px
};

export const setFontSize = async (size: number) => {
    await db.meta.put({ key: 'fontSize', value: size });
};

// --- Search ---

export const searchNotes = async (query: string): Promise<SearchResult[]> => {
  if (!query) return [];
  const q = query.toLowerCase();
  // Using filter allows for fuzzy/substring search which the title index (startsWith) cannot do efficiently.
  return await db.notes
    .filter(n => n.title.toLowerCase().includes(q))
    // Removed limit(10) to show all results
    .toArray()
    .then(notes => notes.map(n => ({ id: n.id, title: n.title })));
};

export const getAllNotes = async (): Promise<Note[]> => {
  return await db.notes.toArray();
};

export const importNotes = async (notes: Note[]) => {
  // Clear existing notes
  await db.notes.clear();

  // Process in small chunks with yields to avoid blowing up memory/transaction limits and crashing the tab
  const CHUNK_SIZE = 50; 
  for (let i = 0; i < notes.length; i += CHUNK_SIZE) {
    const chunk = notes.slice(i, i + CHUNK_SIZE);
    await db.notes.bulkAdd(chunk);
    
    // YIELD to the main thread. This is crucial for preventing "Aw Snap" on large imports.
    // It allows the browser to handle other events and GC.
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  // Update Meta
  const favorites = notes.filter(n => n.isFavorite).map(n => n.id);
  await db.meta.put({ key: 'favoritesList', value: favorites });
  
  // Reset central note to first one if possible
  if (notes.length > 0) {
      await db.meta.put({ key: 'currentCentralNoteId', value: notes[0].id });
      await db.meta.put({ key: 'homeNoteId', value: notes[0].id });
  }
};