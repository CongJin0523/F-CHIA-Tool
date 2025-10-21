// src/components/HeaderExportActions.tsx
import React, { useMemo } from "react";
import { useZoneStore } from "@/store/zone-store";
import { getGraphStoreHook } from "@/store/graph-registry";
import { graphToIR } from "@/common/graphToIR";
import { deriveRowSpans } from "@/common/deriveRowSpans";
import type { IR } from "@/common/ir";

// Reuse your existing components (no new export functions added)
import ExportStructuredPDFButton from "@/components/ExportTablePDFButton"; // the jsPDF + autoTable exporter
import DownloadButton from "@/components/DownloadButton";                 // the React Flow PNG exporter

/**
 * NOTE: <DownloadButton /> calls useReactFlow(), so this component must be rendered
 * somewhere **inside** a <ReactFlowProvider> / <ReactFlow> tree on the page.
 * The PDF exporter does not depend on React Flow.
 */
const HeaderExportActions: React.FC = () => {
  // current zone / project info
  const zoneId = useZoneStore((s) => s.selectedId);
  const projectName = useZoneStore((s) => s.projectName);
  const zoneLabel =
    useZoneStore((s) => s.zones.find((z) => z.id === s.selectedId)?.label) ??
    "Unnamed Zone";

  // get graph for current zone
  const storeHook = useMemo(() => getGraphStoreHook(zoneId), [zoneId]);
  const nodes = storeHook((s) => s.nodes);
  const edges = storeHook((s) => s.edges);

  // zone description (from the "zone" node content if it exists)
  const zoneDescription = useMemo(() => {
    const zoneNode = nodes.find((n) => n.type === "zone");
    return (zoneNode?.data?.content as string) || "";
  }, [nodes]);

  // Build the IR once, then derive the table-ready structure (rowSpans etc.)
  const defaultValues = useMemo<IR>(() => {
    const ir = graphToIR(nodes, edges);
    return deriveRowSpans(ir);
  }, [nodes, edges]);

  return (
    <div
      className="flex items-center gap-2"
      style={{ position: "relative", zIndex: 10 }}
    >
      {/* React Flow image exporter (PNG) — reused as-is */}
      <DownloadButton />

      {/* Structured PDF exporter — pass data derived from stores */}
      <ExportStructuredPDFButton
        data={defaultValues}
        projectName={projectName}
        zoneLabel={zoneLabel}
        zoneDescription={zoneDescription}
        // fileName is optional; the component already builds a name with project/zone + timestamp
      />
    </div>
  );
};

export default HeaderExportActions;