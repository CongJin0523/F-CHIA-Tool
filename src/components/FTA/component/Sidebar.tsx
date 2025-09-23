import React from 'react';
import { useDnD } from './DnDContext';

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

  {/* Intermediate Event */}
  <div
    className="dndnode cursor-move border-2 w-40 border-yellow-200 bg-yellow-50 text-yellow-800 text-xs rounded px-2 py-1 shadow hover:bg-yellow-200"
    onDragStart={(event) => onDragStart(event, 'interEvent')}
    draggable
  >
    Intermediate Event
  </div>

  {/* Logic Node */}
  <div
    className="dndnode cursor-move border-2 border-gray-500 bg-white text-gray-700 text-xs rounded-full w-8 h-8 flex items-center justify-center shadow hover:bg-gray-100"
    onDragStart={(event) => onDragStart(event, 'logic')}
    draggable
  >
    Logic gate
  </div>

  {/* Basic Event */}
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