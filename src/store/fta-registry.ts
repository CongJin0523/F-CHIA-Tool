// src/store/fta-registry.ts
import type { Edge } from '@xyflow/react';
import type { FtaNodeTypes } from '@/common/fta-node-type';
import { createFtaStore } from './fta-store';

// 你的 createFtaStore 返回的是“hook”，这里就把 hook 存起来
export type FtaStoreHook = ReturnType<typeof createFtaStore>;

const registry: Record<string, FtaStoreHook | undefined> = {};

function ftaKey(zoneId: string, taskId: string) {
  // 用于 registry 的 key 以及 persist 的 key 尾巴
  return `${zoneId}::${taskId}`;
}

/** 取（或新建）对应 (zoneId, taskId) 的 FTA store hook */
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

/** 删除内存中的 hook，并清除本地持久化的记录 */
export function deleteFtaStore(zoneId: string, taskId: string) {
  const id = ftaKey(zoneId, taskId);
  delete registry[id];
  // 与 createFtaStore 的 persist({ name: `fta-${id}` }) 对齐
  try {
    localStorage.removeItem(`fta-${id}`);
  } catch {
    /* ignore in SSR */
  }
}