import React from 'react';
import { useDnD } from './DnDContext';

export default function Sidebar() {
  const [_, setType] = useDnD();

  const onDragStart = (event, nodeType) => {
    setType(nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="space-y-2 text-sm text-gray-700">
      <div className="font-medium mb-2">You can drag these nodes to the pane on the right.</div>
      <div className="dndnode cursor-move bg-white px-3 py-2 border rounded shadow-sm hover:bg-gray-100"
        onDragStart={(event) => onDragStart(event, 'topEvent')} draggable>
        Top Event
      </div>
      <div className="dndnode cursor-move bg-white px-3 py-2 border rounded shadow-sm hover:bg-gray-100"
        onDragStart={(event) => onDragStart(event, 'interEvent')} draggable>
        Intermediate Event
      </div>
      <div className="dndnode cursor-move bg-white px-3 py-2 border rounded shadow-sm hover:bg-gray-100"
        onDragStart={(event) => onDragStart(event, 'logic')} draggable>
        Logic
      </div>
      <div className="dndnode cursor-move bg-white px-3 py-2 border rounded shadow-sm hover:bg-gray-100"
        onDragStart={(event) => onDragStart(event, 'basicEvent')} draggable>
        Basic Event
      </div>
    </aside>
  );
};