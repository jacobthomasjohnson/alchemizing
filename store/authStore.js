"use client";

import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

export default useAuthStore;