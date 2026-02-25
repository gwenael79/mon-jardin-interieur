import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  session:   null,
  isLoading: true,

  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  reset:      () => set({ session: null, isLoading: false }),
}))
