// src/store/graph-registry.ts
import { createGraphStore, type GraphStore } from './graph-store';

// Registry to store GraphStore instances by zoneId
const registry: Record<string, GraphStore> = {};

/**
 * Retrieve (or create if not exists) the GraphStore for the given zoneId.
 * Ensures each zoneId has a unique GraphStore instance.
 */
export function getGraphStoreHook(zoneId: string): GraphStore {
  if (!registry[zoneId]) {
    registry[zoneId] = createGraphStore(zoneId); // Returns a Zustand store (hook)
  }
  return registry[zoneId];
}

/**
 * Delete the in-memory GraphStore for the given zoneId and remove its persisted local storage record.
 * Call this when a zone is deleted to free up memory and storage.
 */
export function deleteGraphStore(zoneId: string) {
  delete registry[zoneId];
  // Optionally: remove the corresponding persisted data in localStorage
  localStorage.removeItem(`graph-${zoneId}`);
}