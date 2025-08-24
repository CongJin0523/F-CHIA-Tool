// src/store/graph-registry.ts
import { createGraphStore, type GraphStore } from './graph-store';

const registry: Record<string, GraphStore> = {};

export function getGraphStoreHook(zoneId: string): GraphStore {
  if (!registry[zoneId]) {
    registry[zoneId] = createGraphStore(zoneId); // 返回的是“hook”
  }
  return registry[zoneId];
}

export function deleteGraphStore(zoneId: string) {
  delete registry[zoneId];
  // 可选：清掉对应的本地持久化
  localStorage.removeItem(`graph-${zoneId}`);
}