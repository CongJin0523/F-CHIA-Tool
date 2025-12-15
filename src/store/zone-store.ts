// src/store/zone-store.ts
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { deleteGraphStore, getGraphStoreHook } from "./graph-registry";

export type Zone = { id: string; label: string };

type ZoneState = {
  zones: Zone[];
  selectedId?: string;
  selectedFta?: { zoneId: string; taskId: string };

  projectName: string;
  setProjectName: (name: string) => void;
  addZone: (label: string) => Zone;
  removeZone: (id: string) => void;
  renameZone: (id: string, nextLabel: string) => void;
  setSelected: (id?: string) => void;
  setSelectedFta: (sel?: { zoneId: string; taskId: string }) => void;
};

// Simple slug function to generate a URL-friendly and unique zone id from a label
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
        projectName: "Untitled Project",
        setProjectName: (name) => set({ projectName: name || "Untitled Project"}),
        // Add a new zone with a unique id and label, and create its corresponding GraphStore
        addZone: (label) => {
          const base = slug(label);
          const ids = new Set(get().zones.map(z => z.id));
          let id = base, i = 2;
          while (ids.has(id)) id = `${base}-${i++}`;

          const zone = { id, label };
          getGraphStoreHook(id); // Ensure the corresponding GraphStore is created
          set(state => ({ zones: [...state.zones, zone], selectedId: id }));
          return zone;
        },

        // Remove a zone by id and clean up its associated GraphStore
        removeZone: (id) => {
          set(state => {
            const zones = state.zones.filter(z => z.id !== id);
            const selectedId = state.selectedId === id ? undefined : state.selectedId;
            deleteGraphStore(id); // Clean up the corresponding GraphStore
            return { zones, selectedId };
          });
        },

        // Rename a zone by id
        renameZone: (id, nextLabel) => {
          set(state => ({
            zones: state.zones.map(z => z.id === id ? { ...z, label: nextLabel } : z),
          }));
        },

        // Set the currently selected zone by id
        setSelected: (id) => set({ selectedId: id }),
        // Set the currently selected FTA (Fault Tree Analysis) by zone and task id
        setSelectedFta: (sel?: { zoneId: string; taskId: string }) =>
          set({ selectedFta: sel }),
      }),
      { name: "zones-store" } // Local persistence key for storing zones state
    )
  )
);