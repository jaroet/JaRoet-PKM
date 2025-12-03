import Dexie, { Table } from 'dexie';
import { Note, Topology, SearchResult } from '../types';

// Extend Dexie
class PKMDatabase extends Dexie {
  notes!: Table<Note, string>;
  meta!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('NexusNodeDB');
    (this as any).version(1).stores({
      notes: 'id, title, *linksTo, *relatedTo', // Indexes required by prompt
      meta: 'key',
    });
  }
}

export const db = new PKMDatabase();

// --- Seed Data ---
export const seedDatabase = async () => {
  const count = await db.notes.count();
  if (count === 0) {
    const now = Date.now();
    const n1 = {
      id: crypto.randomUUID(),
      title: 'Welcome to NexusNode',
      content: '# Welcome\n\nThis is your Central Note. Use arrow keys to navigate.',
      linksTo: [],
      relatedTo: [],
      isFavorite: false,
      createdAt: now,
      modifiedAt: now,
    };
    const n2 = {
      id: crypto.randomUUID(),
      title: 'Navigation Help',
      content: 'Use arrow keys to move. Shift+Enter to edit.',
      linksTo: [],
      relatedTo: [],
      isFavorite: false,
      createdAt: now,
      modifiedAt: now,
    };
    const n3 = {
      id: crypto.randomUUID(),
      title: 'Concepts',
      content: 'Links define the structure.',
      linksTo: [],
      relatedTo: [],
      isFavorite: false,
      createdAt: now,
      modifiedAt: now,
    };

    // Link N1 -> N2 (Downer)
    n1.linksTo.push(n2.id);
    // Link N1 -> N3 (Lefter)
    n1.relatedTo.push(n3.id);

    await db.notes.bulkAdd([n1, n2, n3]);
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