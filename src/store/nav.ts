"use client";

import { create } from "zustand";

export type Screen =
  | { name: "home" }
  | { name: "categoria"; comercianteId: string }
  | { name: "detalle"; anuncioId: string }
  | { name: "nuevo" }
  | { name: "editor"; anuncioId?: string };

type NavState = {
  screen: Screen;
  history: Screen[];
  navigate: (s: Screen) => void;
  back: () => void;
  resetHome: () => void;
};

export const useNav = create<NavState>((set, get) => ({
  screen: { name: "home" },
  history: [],
  navigate: (s) =>
    set((state) => ({
      screen: s,
      history: [...state.history, state.screen],
    })),
  back: () => {
    const { history } = get();
    if (history.length > 0) {
      const prev = history[history.length - 1];
      set({
        screen: prev,
        history: history.slice(0, -1),
      });
    }
  },
  resetHome: () =>
    set({
      screen: { name: "home" },
      history: [],
    }),
}));
