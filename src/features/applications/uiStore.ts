import { create } from 'zustand';

/** Ephemeral UI state shared by the list and the table (the search box). */
export const useSearchStore = create<{ search: string; setSearch: (search: string) => void }>(
  (set) => ({
    search: '',
    setSearch: (search) => set({ search }),
  }),
);
