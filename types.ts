export interface Note {
  id: string;
  title: string;
  content: string;
  linksTo: string[];   // Downers (Children)
  relatedTo: string[]; // Lefters (Lateral)
  isFavorite: boolean;
  createdAt: number;
  modifiedAt: number;
}

export type Section = 'center' | 'up' | 'down' | 'left' | 'right';

export interface Topology {
  center: Note | null;
  uppers: Note[];
  downers: Note[];
  lefters: Note[];
  righters: Note[];
}

export interface SearchResult {
  id: string;
  title: string;
}

export type Theme = 'light' | 'dark';

export interface Point {
  x: number;
  y: number;
}

export interface Connection {
  from: Point;
  to: Point;
  type: 'hierarchical' | 'lateral';
}
