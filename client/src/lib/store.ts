import { create } from 'zustand';
import type { User, Stage, ChatMessage } from '@shared/schema';

interface AppState {
  currentUser: User | null;
  stage: Stage | null;
  users: User[];
  messages: ChatMessage[];
  isAdmin: boolean;
  
  setCurrentUser: (user: User | null) => void;
  setStage: (stage: Stage | null) => void;
  setUsers: (users: User[]) => void;
  addMessage: (msg: ChatMessage) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  currentUser: null,
  stage: null,
  users: [],
  messages: [],
  isAdmin: false,
  
  setCurrentUser: (user) => set({ currentUser: user }),
  setStage: (stage) => set({ stage }),
  setUsers: (users) => set({ users }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  reset: () => set({ currentUser: null, stage: null, users: [], messages: [], isAdmin: false }),
}));
