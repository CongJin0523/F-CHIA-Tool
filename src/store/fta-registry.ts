// src/store/fta-registry.ts
import type { Edge } from '@xyflow/react';
import type { FtaNodeTypes } from '@/common/fta-node-type';
import { createFtaStore } from './fta-store';

// The createFtaStore function returns a "hook"; here we store the hook instance for each (zoneId, taskId) pair
export type FtaStoreHook = ReturnType<typeof createFtaStore>;

const registry: Record<string, FtaStoreHook | undefined> = {};

// Generate a unique key for the registry and for the persist key suffix
function ftaKey(zoneId: string, taskId: string) {
  return `${zoneId}::${taskId}`;
}

/**
 * Retrieve (or create if not exists) the FTA store hook for the given (zoneId, taskId).
 * This ensures each (zoneId, taskId) pair has a unique store instance.
 */
export function getFtaStoreHook(
  zoneId: string,
  taskId: string,
  initial?: { nodes: FtaNodeTypes[]; edges: Edge[] }
): FtaStoreHook {
  const id = ftaKey(zoneId, taskId);
  if (!registry[id]) {
    registry[id] = createFtaStore(id, initial);
  }
  return registry[id]!;
}

/**
 * Delete the in-memory store hook for the given (zoneId, taskId) and remove its persisted local storage record.
 * This should be called when the FTA store is no longer needed to free up memory and storage.
 */
export function deleteFtaStore(zoneId: string, taskId: string) {
  const id = ftaKey(zoneId, taskId);
  delete registry[id];
  // Remove the corresponding persisted data in localStorage (must match the key used in createFtaStore)
  try {
    localStorage.removeItem(`fta-${id}`);
  } catch {
    // Ignore errors, e.g., in server-side rendering (SSR) environments
  }
}