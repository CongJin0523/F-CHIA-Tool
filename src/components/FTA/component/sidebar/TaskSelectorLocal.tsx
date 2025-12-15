// components/FTA/TaskSelectorLocal.tsx
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listAllFtaTasksWithTitles } from '@/common/fta-storage';
import { Trash2 } from 'lucide-react';
import { deleteFtaStore } from '@/store/fta-registry';
import { useZoneStore } from '@/store/zone-store';

type Item = {
  zoneId: string;
  taskId: string;
  title?: string;
};

export default function TaskSelectorLocal() {
  const zones = useZoneStore((s) => s.zones);
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);

  const currentZone = params.get('zone');
  const currentTask = params.get('task');

  // Get and set the selected FTA (Fault Tree Analysis) in the store
  const setSelectedFta = useZoneStore(s => s.setSelectedFta);
  const selectedFta = useZoneStore(s => s.selectedFta);

  const load = useCallback(() => {
    const list = listAllFtaTasksWithTitles();
    setItems(list);
  }, []);

  useEffect(() => {
    load();

  // Listen for changes in localStorage from other tabs to keep the list in sync
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.startsWith('fta-')) load();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [load]);

  const onSelect = (zoneId: string, taskId: string) => {
    setParams({ zone: zoneId, task: taskId });
  // Also update the selectedFta in the store for cross-component sync
    setSelectedFta?.({ zoneId, taskId });
  };

  const onDelete = async (zoneId: string, taskId: string) => {
    const name = items.find(i => i.zoneId === zoneId && i.taskId === taskId)?.title ?? taskId;
    const ok = window.confirm(`Delete this FTA?\n\nZone: ${zoneId}\nTask: ${name}`);
    if (!ok) return;

    try {
      deleteFtaStore(zoneId, taskId);
      localStorage.removeItem(`fta-${zoneId}::${taskId}`);
    } finally {
  // If the deleted FTA is currently selected, clear the selection in the store
      const sel = useZoneStore.getState().selectedFta;
      if (sel && sel.zoneId === zoneId && sel.taskId === taskId) {
        useZoneStore.getState().setSelectedFta(undefined);
      }

  // Refresh the FTA task list after deletion
      const next = listAllFtaTasksWithTitles();
      setItems(next);

  // Update the URL to reflect the new selection or clear it if no items remain
      if (currentZone === zoneId && currentTask === taskId) {
        if (next.length > 0) {
          setParams({ zone: next[0].zoneId, task: next[0].taskId });
        } else {
          // No items left: clear the URL
          setParams({});
        }
      }
    }
  };

  if (items.length === 0) {
    return (
      <div className="p-3 space-y-2">
        <div className="text-xs text-neutral-400">No FTA found.</div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      <ul className="space-y-1">
        {items.map(({ zoneId, taskId, title }) => {
          const active = currentZone === zoneId && currentTask === taskId;
          return (
            <li key={`${zoneId}::${taskId}`} className="group flex items-center gap-1 max-w-[280px]">
              {/* Select button for this FTA task */}
              <button
                type="button"
                onClick={() => onSelect(zoneId, taskId)}
                className={`flex-1 min-w-0 text-left text-xs px-2 py-1 rounded transition-colors ${active ? 'bg-blue-100 text-blue-700' : 'hover:bg-neutral-100'
                  }`}
                title={`Zone: ${zoneId}\nTask: ${taskId}`}
              >
                <div className="truncate font-medium">{`${zones.find(z => z.id === zoneId)?.label ?? zoneId}: ${title ?? taskId}`}</div>
                <div className="text-[10px] text-neutral-500 truncate">{zoneId} · {taskId}</div>
              </button>

              {/* Delete button for this FTA task */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(zoneId, taskId); }}
                className="p-1 shrink-0 rounded hover:bg-red-50 text-neutral-400 hover:text-red-600"
                title="Delete this FTA"
                aria-label="Delete FTA"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}