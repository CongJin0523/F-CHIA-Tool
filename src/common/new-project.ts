// src/common/new-project.ts
import { useZoneStore } from "@/store/zone-store";
import { getGraphStoreHook, deleteGraphStore } from "@/store/graph-registry";
import { getLayoutedElements, elkOptions } from "@/common/layout-func";
import { initialEdges } from "@/common/initialEdges";
import { initialNodes } from "@/common/initialNodes";
// If you have these helpers, import them. If not, the localStorage scan below is enough.
// import { deleteFtaStore } from "@/store/fta-registry";

// --- A tiny id helper (stable enough for a fresh project) ---
function newZoneId() {
  return `zone-${Math.random().toString(36).slice(2, 8)}`;
}

// --- Default graph (very small, editable prompts for the user) ---
const defaultNodes = initialNodes;

const defaultEdges = initialEdges;

type NewProjectOptions = {
  zoneLabel?: string;         // default "Base Zone"
  onDoneNavigate?: (path: string) => void; // optional navigation callback
};

/**
 * Create a brand-new project:
 *  - clears all graph/FTA persistence
 *  - resets zones to a single "Base Zone"
 *  - seeds a default graph and auto-layouts it
 */
export async function createNewProject(opts: NewProjectOptions = {}) {
  const zoneLabel = opts.zoneLabel ?? "Base Zone";

  // 1) Remove ALL existing graphs from memory & localStorage
  //    a) delete existing graph stores (memory)
  const currentZones = useZoneStore.getState().zones;
  for (const z of currentZones) {
    try { deleteGraphStore(z.id); } catch {}
  }

  //    b) delete persisted keys for graphs & FTAs
  //       (adjust prefixes if your persist names differ)
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (k.startsWith("graph-") || k.startsWith("fta-")) {
      toRemove.push(k);
    }
  }
  for (const k of toRemove) {
    try { localStorage.removeItem(k); } catch {}
  }

  // 2) Reset ZoneStore to a single fresh zone
  const zoneId = newZoneId();
  useZoneStore.setState({
    zones: [{ id: zoneId, label: zoneLabel }],
    selectedId: zoneId,
  });

  // 3) Seed the default graph and run layout
  const graph = getGraphStoreHook(zoneId).getState();
  graph.setNodes(structuredClone(defaultNodes));
  graph.setEdges(structuredClone(defaultEdges));

  const { nodes: layoutedNodes, edges: layoutedEdges } = await getLayoutedElements(
    defaultNodes,
    defaultEdges,
    { "elk.direction": "DOWN", ...elkOptions }
  );
  graph.setNodes(layoutedNodes);
  graph.setEdges(layoutedEdges);

  // 4) Broadcast so canvases can fitView on next frame
  try {
    window.dispatchEvent(new CustomEvent("graph-imported"));
  } catch {}

  // 5) Optional navigate to Diagram
  if (opts.onDoneNavigate) {
    opts.onDoneNavigate("/diagram");
  }
}
