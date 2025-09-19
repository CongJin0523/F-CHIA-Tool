// Header.tsx
import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  NavigationMenu, NavigationMenuList, NavigationMenuItem,
  NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { getGraphStoreHook, deleteGraphStore } from "@/store/graph-registry";
import { useZoneStore } from "@/store/zone-store";
import { elkOptions, getLayoutedElements } from "@/common/layout-func";

// —— 工具函数 —— //
function downloadJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
function importJSON(file: File, onLoad: (data: any) => void) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target?.result as string;
      onLoad(JSON.parse(text));
    } catch (err) {
      console.error("Invalid JSON file.", err);
    }
  };
  reader.readAsText(file);
}

function ListItem({
  title, children, href, ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link to={href}>
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export default function Header() {
  // 让 input 持久存在于 Header 根部
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 导出
  const onExport = () => {
    const { zones, selectedId } = useZoneStore.getState();
    const payload = {
      zones: zones.map((zone) => {
        const graph = getGraphStoreHook(zone.id).getState();
        return { id: zone.id, label: zone.label, nodes: graph.nodes, edges: graph.edges };
      }),
      selectedId,
    };
    downloadJSON(payload, "all-zones.json");
  };

  // 导入回调（这里一定会触发）
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 允许连续导入同一个文件
    e.currentTarget.value = "";
    if (!file) return;

    importJSON(file, async (data) => {
      console.log("Importing JSON data:", data);

      let importedZones: Array<{ id: string; label: string; nodes?: any[]; edges?: any[] }> = [];
      let importedSelectedId: string | undefined;

      if (Array.isArray(data)) {
        importedZones = data;
      } else if (data && Array.isArray(data.zones)) {
        importedZones = data.zones;
        importedSelectedId = data.selectedId;
      } else {
        console.error("Invalid JSON: expect array or { zones:[], selectedId }");
        return;
      }

      // 1) 同步 GraphStores
      const currentZones = useZoneStore.getState().zones;
      const incomingIds = new Set(importedZones.map((z) => z.id));
      for (const z of currentZones) {
        if (!incomingIds.has(z.id)) deleteGraphStore(z.id);
      }
      for (const zone of importedZones) {
        if (!zone?.id) continue;
        const store = getGraphStoreHook(zone.id).getState();
        store.setNodes(zone.nodes || []);
        store.setEdges(zone.edges || []);
      }

      // 2) 同步 Zone 列表和选中值
      const nextZones = importedZones.map((z) => ({ id: z.id, label: z.label ?? z.id }));
      const nextSelectedId =
        importedSelectedId && nextZones.some((z) => z.id === importedSelectedId)
          ? importedSelectedId
          : nextZones[0]?.id;

      useZoneStore.setState({ zones: nextZones, selectedId: nextSelectedId });

      // 3) 对当前选中 zone 自动布局
      if (nextSelectedId) {
        const graphSel = getGraphStoreHook(nextSelectedId).getState();
        const ns = graphSel.nodes;
        const es = graphSel.edges;
        const opts = { "elk.direction": "DOWN", ...elkOptions } as const;
        const { nodes: layoutedNodes, edges: layoutedEdges } =
          await getLayoutedElements(ns, es, opts);
        graphSel.setNodes(layoutedNodes);
        graphSel.setEdges(layoutedEdges);
      }

      // 可选：发事件，Diagram 页面里用它来 fitView
      try {
        window.dispatchEvent(new CustomEvent("graph-imported"));
      } catch {}

      console.log("Import finished:", {
        zones: useZoneStore.getState().zones,
        selectedId: useZoneStore.getState().selectedId,
      });
    });
  };

  return (
    <header className="bg-background sticky top-0 z-50 w-full border-b">
      <div className="flex h-12 items-center px-6">
        {/* 左侧 Logo */}
        <Link to="/" className="text-lg font-semibold hover:text-primary transition-colors">
          F-CHIA Tool
        </Link>

        {/* 右侧菜单 */}
        <div className="ml-auto flex items-center gap-3">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>File</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="min-w-[220px] p-2 mt-2">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                      onClick={onExport}
                    >
                      Export JSON
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Import JSON…
                    </button>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>Go to</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-2 p-2 min-w-[220px]">
                    <ListItem key="table" title="Table" href="/table" />
                    <ListItem key="diagram" title="Diagram" href="/diagram" />
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link to="/docs">Docs</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <span className="text-muted-foreground text-sm">|</span>

          <a
            href="https://github.com/CongJin0523/F-CHIA-Tool"
            target="_blank"
            rel="noreferrer"
            className="ml-2 inline-flex items-center gap-1 text-m hover:text-primary transition-colors"
            title="GitHub Repository"
          >
            <img src="src/icon/github-mark.svg" alt="GitHub" className="w-5 h-5" />
            <span className="hidden md:inline font-bold">GitHub</span>
          </a>
        </div>

        {/* ✅ 持久化的隐藏 input，菜单外层：onChange 一定能触发 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>
    </header>
  );
}