// src/store/zone-store.ts
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { deleteGraphStore, getGraphStoreHook } from "./graph-registry";

export type Zone = { id: string; label: string };

type ZoneState = {
  zones: Zone[];
  selectedId?: string;
  selectedFta?: { zoneId: string; taskId: string };
  addZone: (label: string) => Zone;
  removeZone: (id: string) => void;
  renameZone: (id: string, nextLabel: string) => void;
  setSelected: (id?: string) => void;
  setSelectedFta: (sel?: { zoneId: string; taskId: string }) => void;
};

// 简单 slug
const slug = (s: string) =>
  s.trim().toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "zone";

export const useZoneStore = create<ZoneState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        zones: [
          { id: "zone-1", label: "Base Zone" },
        ],
        selectedId: undefined,
        selectedFta: undefined,

        addZone: (label) => {
          const base = slug(label);
          const ids = new Set(get().zones.map(z => z.id));
          let id = base, i = 2;
          while (ids.has(id)) id = `${base}-${i++}`;

          const zone = { id, label };
          getGraphStoreHook(id); // 确保创建对应的 GraphStore
          set(state => ({ zones: [...state.zones, zone], selectedId: id }));
          return zone;
        },

        removeZone: (id) => {
          set(state => {
            const zones = state.zones.filter(z => z.id !== id);
            const selectedId = state.selectedId === id ? undefined : state.selectedId;
            deleteGraphStore(id); // 清理对应的 GraphStore
            return { zones, selectedId };
          });
        },

        renameZone: (id, nextLabel) => {
          set(state => ({
            zones: state.zones.map(z => z.id === id ? { ...z, label: nextLabel } : z),
          }));
        },

        setSelected: (id) => set({ selectedId: id }),
        setSelectedFta: (sel?: { zoneId: string; taskId: string }) =>
          set({ selectedFta: sel }),
      }),
      { name: "zones-store" } // 本地持久化 key
    )
  )
);