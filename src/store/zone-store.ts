// src/store/zone-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Zone = { id: string; label: string };

type ZoneState = {
  zones: Zone[];
  selectedId?: string;
  addZone: (label: string) => Zone;
  removeZone: (id: string) => void;
  renameZone: (id: string, nextLabel: string) => void;
  setSelected: (id?: string) => void;
};

// 简单 slug
const slug = (s: string) =>
  s.trim().toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "zone";

export const useZoneStore = create<ZoneState>()(
  persist(
    (set, get) => ({
      zones: [
        { id: "zone-1", label: "Base Zone" },
        { id: "zone-2", label: "Zone 2" },
        { id: "zone-3", label: "Zone 3" },
      ],
      selectedId: undefined,

      addZone: (label) => {
        const base = slug(label);
        const ids = new Set(get().zones.map(z => z.id));
        let id = base, i = 2;
        while (ids.has(id)) id = `${base}-${i++}`;

        const zone = { id, label };
        set(state => ({ zones: [...state.zones, zone], selectedId: id }));
        return zone;
      },

      removeZone: (id) => {
        set(state => {
          const zones = state.zones.filter(z => z.id !== id);
          const selectedId = state.selectedId === id ? undefined : state.selectedId;
          return { zones, selectedId };
        });
      },

      renameZone: (id, nextLabel) => {
        set(state => ({
          zones: state.zones.map(z => z.id === id ? { ...z, label: nextLabel } : z),
        }));
      },

      setSelected: (id) => set({ selectedId: id }),
    }),
    { name: "zones-store" } // 本地持久化 key
  )
);