import { create } from 'zustand';
import { NoteWithRelations, NoteGraph } from '@cortex/shared/types';

interface KnowledgeStore {
  notes: NoteWithRelations[];
  selectedNote: NoteWithRelations | null;
  graph: NoteGraph | null;
  searchQuery: string;
  selectedTags: string[];
  isLoading: boolean;

  // Actions
  setNotes: (notes: NoteWithRelations[]) => void;
  selectNote: (note: NoteWithRelations | null) => void;
  setGraph: (graph: NoteGraph) => void;
  setSearchQuery: (query: string) => void;
  toggleTag: (tagId: string) => void;
  clearFilters: () => void;
  setLoading: (isLoading: boolean) => void;

  // Optimistic updates
  optimisticallyAddNote: (note: NoteWithRelations) => void;
  optimisticallyUpdateNote: (noteId: string, updates: Partial<NoteWithRelations>) => void;
  optimisticallyDeleteNote: (noteId: string) => void;
}

export const useKnowledgeStore = create<KnowledgeStore>((set, get) => ({
  notes: [],
  selectedNote: null,
  graph: null,
  searchQuery: '',
  selectedTags: [],
  isLoading: false,

  setNotes: (notes) => set({ notes }),

  selectNote: (note) => set({ selectedNote: note }),

  setGraph: (graph) => set({ graph }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  toggleTag: (tagId) => {
    const { selectedTags } = get();
    set({
      selectedTags: selectedTags.includes(tagId)
        ? selectedTags.filter((id) => id !== tagId)
        : [...selectedTags, tagId],
    });
  },

  clearFilters: () => set({ searchQuery: '', selectedTags: [] }),

  setLoading: (isLoading) => set({ isLoading }),

  optimisticallyAddNote: (note) => {
    set((state) => ({
      notes: [note, ...state.notes],
    }));
  },

  optimisticallyUpdateNote: (noteId, updates) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === noteId ? { ...note, ...updates } : note
      ),
      selectedNote:
        state.selectedNote?.id === noteId
          ? { ...state.selectedNote, ...updates }
          : state.selectedNote,
    }));
  },

  optimisticallyDeleteNote: (noteId) => {
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== noteId),
      selectedNote: state.selectedNote?.id === noteId ? null : state.selectedNote,
    }));
  },
}));