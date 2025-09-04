import { useEffect, useRef } from "react";
import { useZoneStore } from "@/store/zone-store";
import { getGraphStoreHook, deleteGraphStore } from "@/store/graph-registry";
import { Panel, useReactFlow } from '@xyflow/react';
import { elkOptions, getLayoutedElements } from '@/common/layout-func';
import Button from '@mui/material/Button';
function downloadJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

function importJSON(file: File, onLoad: (data: any) => void) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target?.result as string;
      const parsed = JSON.parse(text);
      onLoad(parsed);
    } catch (err) {
      console.error("Invalid JSON file.", err);
    }
  };
  reader.readAsText(file);
}

function ExportJSONButton() {
  const { fitView } = useReactFlow();
  const { zones, selectedId } = useZoneStore.getState();
  const payload = {
    zones: zones.map((zone) => {
      const graph = getGraphStoreHook(zone.id).getState();
      return {
        id: zone.id,
        label: zone.label,
        nodes: graph.nodes,
        edges: graph.edges,
      };
    }),
    selectedId,
  };

  const onClick = () => {
    downloadJSON(payload, `all-zones.json`);
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onImport = () => {
    fileInputRef.current?.click();
  };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importJSON(file, (data) => {
      // 标准化为新结构：{ zones: [...], selectedId }
      let importedZones: Array<{ id: string; label: string; nodes?: any[]; edges?: any[] }> = [];
      let importedSelectedId: string | undefined = undefined;

      if (Array.isArray(data)) {
        // 兼容旧格式：顶层是数组
        importedZones = data;
      } else if (data && Array.isArray(data.zones)) {
        importedZones = data.zones;
        importedSelectedId = data.selectedId;
      } else {
        console.error("Invalid JSON: expect array or { zones:[], selectedId }");
        return;
      }

      // 1) 先恢复 GraphStores（清理旧的，创建/更新新的）
      const currentZones = useZoneStore.getState().zones;
      const currentIds = new Set(currentZones.map(z => z.id));
      const incomingIds = new Set(importedZones.map(z => z.id));

      // 删除不再存在的 GraphStore
      for (const z of currentZones) {
        if (!incomingIds.has(z.id)) deleteGraphStore(z.id);
      }

      // 写入/覆盖每个 zone 的图
      for (const zone of importedZones) {
        if (!zone?.id) continue;
        const store = getGraphStoreHook(zone.id).getState(); // 确保存在
        store.setNodes(zone.nodes || []);
        store.setEdges(zone.edges || []);
      }

      // 2) 恢复 ZoneStore（zones 列表 + selectedId）
      const nextZones = importedZones.map(z => ({ id: z.id, label: z.label ?? z.id }));
      // selectedId 必须存在于 zones，否则回退到第一个
      const nextSelectedId = importedSelectedId && nextZones.some(z => z.id === importedSelectedId)
        ? importedSelectedId
        : nextZones[0]?.id;

      useZoneStore.setState({
        zones: nextZones,
        selectedId: nextSelectedId,
      });

      // 3) 导入完成后对当前选中 zone 进行一次自动布局并 fitView
      if (nextSelectedId) {
        const graphSel = getGraphStoreHook(nextSelectedId).getState();
        const ns = graphSel.nodes;
        const es = graphSel.edges;
        const opts = { 'elk.direction': 'DOWN', ...elkOptions } as const;
        getLayoutedElements(ns, es, opts).then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
          graphSel.setNodes(layoutedNodes);
          graphSel.setEdges(layoutedEdges);
          // 等下一帧 ReactFlow 同步后再 fitView
          requestAnimationFrame(() => fitView());
        });
      }

      console.log("Import finished:", { zones: nextZones, selectedId: nextSelectedId });
    });
  };

  return (
    <Panel position="top-left">
      <div className="flex flex-col gap-2">
        <Button className="download-btn xy-theme__button" onClick={onClick}>
          Export JSON
        </Button>
        <Button className="upload-btn xy-theme__button" onClick={onImport}>
          Import JSON
        </Button>
        <input
          type="file"
          accept="application/json"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>
    </Panel>
  );
}

export default ExportJSONButton;
