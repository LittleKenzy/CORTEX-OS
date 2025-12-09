export interface NoteGraphNode {
  id: string;
  title: string;
  x?: number;
  y?: number;
  connections: number;
  isPinned: boolean;
}

export interface NoteGraphEdge {
  from: string;
  to: string;
  type: 'reference' | 'parent' | 'child' | 'related';
}

export interface NoteGraph {
  nodes: NoteGraphNode[];
  edges: NoteGraphEdge[];
}

export interface BacklinkReference {
  noteId: string;
  noteTitle: string;
  excerpt: string;
  createdAt: Date;
}

export interface NoteWithRelations {
  id: string;
  title: string;
  content: string;
  markdown: string;
  excerpt: string | null;
  tags: Array<{ id: string; name: string; color: string | null }>;
  backlinks: BacklinkReference[];
  forwardLinks: Array<{ id: string; title: string }>;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
}