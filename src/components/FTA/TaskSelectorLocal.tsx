// components/FTA/TaskSelectorLocal.tsx
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listAllFtaTasks, listAllFtaTasksWithTitles } from '@/common/fta-storage';

export default function TaskSelectorLocal() {
  const [params, setParams] = useSearchParams();
  const items = useMemo(() => listAllFtaTasksWithTitles(), []);

  const currentZone = params.get('zone');
  const currentTask = params.get('task');

  return (
    <div className="p-3 space-y-2">
      <div className="text-xs font-semibold text-neutral-500">All FTAs</div>
      {items.length === 0 ? (
        <div className="text-xs text-neutral-400">No FTA found.</div>
      ) : (
        <ul className="space-y-1">
          {items.map(({ zoneId, taskId, title }) => {
            const active = currentZone === zoneId && currentTask === taskId;
            return (
              <li key={`${zoneId}::${taskId}`}>
                <button
                  type="button"
                  onClick={() => setParams({ zone: zoneId, task: taskId })}
                  className={`w-full text-left text-xs px-2 py-1 rounded ${
                    active ? 'bg-blue-100 text-blue-700' : 'hover:bg-neutral-100'
                  }`}
                  title={`Zone: ${zoneId}\nTask: ${taskId}`}
                >
                  <div className="truncate">{`${zoneId}:${title}`}</div>
                  <div className="text-[10px] text-neutral-500 truncate">{zoneId} · {taskId}</div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}