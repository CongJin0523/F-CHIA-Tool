import React from 'react';
import { useDnD } from './DnDContext';
import { BaseNode } from '@/components/base-node';

export default function NodeSelector() {
  const [_, setType] = useDnD();

  const onDragStart = (event, nodeType) => {
    setType(nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="space-y-2 text-sm text-gray-700">
      <div className="font-medium mb-2">You can drag these nodes to the pane on the right.</div>

      {/* Top Event */}
      {/* <div
    className="dndnode cursor-move border-2 w-20 border-green-200 bg-green-50 text-xs rounded px-2 py-1 shadow hover:bg-green-200"
    onDragStart={(event) => onDragStart(event, 'topEvent')}
    draggable
  >
    Top Event
  </div> */}
      <div className="flex flex-col items-center space-y-1">
        <div
          className="dndnode cursor-move border-2 w-20 h-10 border-green-200 bg-green-50 text-green-800 text-xs rounded px-2 py-1 shadow hover:bg-yellow-200"
          onDragStart={(event) => onDragStart(event, 'interEvent')}
          draggable
        />
        <span className="text-xs text-green-800">Top Event</span>
      </div>

      {/* Intermediate Event */}
      <div className="flex flex-col items-center space-y-1">
        <div
          className="dndnode cursor-move border-2 w-20 h-10 border-yellow-200 bg-yellow-50 text-yellow-800 text-xs rounded px-2 py-1 shadow hover:bg-yellow-200"
          onDragStart={(event) => onDragStart(event, 'interEvent')}
          draggable
        />
        <span className="text-xs text-yellow-800">Intermediate Event</span>
      </div>

      {/* Logic Node */}
      <div
        className="dndnode cursor-move flex flex-col items-center"
        onDragStart={(event) => onDragStart(event, 'logic')}
        draggable
      >
        <BaseNode className="w-20 p-0">
          <div className="p-0 flex items-center justify-center">
            <svg
              className="w-full h-full"
              viewBox="-40 -40 80 60"
              preserveAspectRatio="xMidYMid meet"
            >
              <g transform="translate(0, 5)">
                {/* OR gate */}
                <path
                  d="M -20 0 C -20 -15 -10 -30 0 -30 C 10 -30 20 -15 20 0 C 10 -6 -10 -6 -20 0"
                  stroke="currentColor"
                  fill="none"
                  strokeWidth={2}
                />
                {/* 上下连接柱 */}
                <path d="M 0 -30 0 -46" stroke="currentColor" strokeWidth={2} />
                <path d="M 0 0 0 15" stroke="currentColor" strokeWidth={2} />
              </g>
            </svg>
          </div>
        </BaseNode>
        <div className="text-xs text-muted-foreground">Logic Gate</div>
      </div>

      {/* Basic Event */}
      <div className="flex flex-col items-center space-y-1">
        <div
          className="dndnode cursor-move border-2 w-15 h-15 rounded-full border-red-200 bg-red-50 text-xs px-2 py-1 shadow hover:bg-red-200"
          onDragStart={(event) => onDragStart(event, 'basicEvent')}
          draggable
        />
        <span className="text-xs text-red-800">Basic Event</span>
      </div>


      <div
        className="dndnode cursor-move border-2 w-20 h-20 rounded-full border-red-200 bg-red-50 text-xs px-2 py-1 shadow hover:bg-red-200"
        onDragStart={(event) => onDragStart(event, 'basicEvent')}
        draggable
      >
        Basic Event
      </div>
    </aside>
  );
};