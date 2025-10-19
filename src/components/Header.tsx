// Header.tsx
import { type Edge } from "@xyflow/react";
import { useRef, useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  NavigationMenu, NavigationMenuList, NavigationMenuItem,
  NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { getGraphStoreHook, deleteGraphStore } from "@/store/graph-registry";
import { useZoneStore } from "@/store/zone-store";
import { elkOptions, getLayoutedElements } from "@/common/layout-func";
import { createNewProject } from "@/common/new-project";
import { clearAppLocalStorage } from "@/common/utils/claarLocalStorage";
import { getFtaStoreHook } from "@/store/fta-registry";
import type { ChecksMap } from "@/store/fta-store";
import type { FtaNodeTypes } from "@/common/fta-node-type";
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

type FtaDumpItem = {
  zoneId: string;
  taskId: string;
  nodes: FtaNodeTypes[];
  edges: Edge[];
  causeChecks?: ChecksMap;
};
function readAllFtasFromLocalStorage(): { items: FtaDumpItem[]; } {
  const items: FtaDumpItem[] = [];
  let selectedFta: { zoneId: string; taskId: string } | undefined;


  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) || "";
    if (!key.startsWith("fta-")) continue;

    // key format we expect: fta-${zoneId}::${taskId}
    const id = key.slice(4);
    const [zoneId, taskId] = id.split("::");
    if (!zoneId || !taskId) continue;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);

      // Zustand persist can be { state: {...} } or plain {nodes, edges}
      const state = parsed?.state ?? parsed;
      const nodes = state?.nodes ?? [];
      const edges = state?.edges ?? [];
      const causeChecks = state?.causeChecks ?? {};
      items.push({ zoneId, taskId, nodes, edges, causeChecks });
    } catch {
      // ignore malformed entries
    }
  }

  return { items };
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
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [confirmImportOpen, setConfirmImportOpen] = useState(false);

  const projectName = useZoneStore((state) => state.projectName);
  const setProjectName = useZoneStore((state) => state.setProjectName);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(projectName);
  const [newProjectName, setNewProjectName] = useState("");
  useEffect(() => setNameDraft(projectName), [projectName]);

  const commitProjectName = () => {
    setProjectName(nameDraft);
    setEditingName(false);
    toast.success("Project name updated");
  };

  const confirmCreateNewProject = async () => {
    const trimmedName = newProjectName.trim() || "Untitled Project";
    try {
      await createNewProject();
      useZoneStore.getState().setProjectName(trimmedName); // ✅ save new project name
      toast.success(`New project "${trimmedName}" created`);
    } finally {
      setNewProjectOpen(false);
    }
  };
  // 导出
  const onExport = () => {
    const { zones, selectedId, selectedFta, projectName } = useZoneStore.getState();
    const payload = {
      projectName,
      zones: zones.map((zone) => {
        const graph = getGraphStoreHook(zone.id).getState();
        return { id: zone.id, label: zone.label, nodes: graph.nodes, edges: graph.edges };
      }),
      selectedId,
      selectedFta,
      fta: readAllFtasFromLocalStorage(),
    };
    const safeName = projectName?.trim() ? projectName.trim().replace(/[^\w\-]+/g, "_") : "project";
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(
      now.getHours()
    )}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const fileName = `${safeName}_${timestamp}.json`;
    downloadJSON(payload, fileName);
  };

  // 导入回调（这里一定会触发）
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 允许连续导入同一个文件
    e.currentTarget.value = "";
    if (!file) return;

    importJSON(file, async (data) => {
      try {
        // 1) Parse & validate (NO CLEAR yet)
        let importedZones: Array<{ id: string; label: string; nodes?: any[]; edges?: any[] }> = [];
        let importedSelectedId: string | undefined;
        let importedSelectedFta: { zoneId: string; taskId: string } | undefined;
        let importedFtaDump: Array<FtaDumpItem> = [];
        if (Array.isArray(data)) {
          importedZones = data;
        } else if (data && Array.isArray(data.zones) && Array.isArray(data.fta.items)) {
          importedZones = data.zones;
          importedSelectedId = data.selectedId;
          importedSelectedFta = data.selectedFta;
          importedFtaDump = data.fta.items;
        } else {
          throw new Error("Invalid JSON: expect array or { zones:[], selectedId, selectedFta, fta:{ items:[] } }");
        }

        if (!importedZones.length) {
          throw new Error("The file contains no zones to import.");
        }
        if (!importedFtaDump.length) {
          console.warn("The file contains no FTAs to import.");
        }

        // 2) Now it’s safe to CLEAR current app data
        const currentZones = useZoneStore.getState().zones;
        // clear in-memory graph stores (optional but tidy)
        for (const z of currentZones) {
          try { deleteGraphStore(z.id); } catch { }
        }
        // clear FTA stores (optional if you use them)
        // If you have a way to enumerate existing FTA keys, remove them here.
        // Or just rely on localStorage cleanup below.

        // reset ZoneStore so we start from a clean slate
        useZoneStore.setState({ zones: [], selectedId: undefined, selectedFta: undefined, projectName: "Untitled Project" });

        // clear persisted localStorage for our app (graph-/fta-/zone-store/etc)
        clearAppLocalStorage();

        // 3) Rebuild from imported data
        for (const zone of importedZones) {
          if (!zone?.id) continue;
          const store = getGraphStoreHook(zone.id).getState(); // ensures a store exists
          store.setNodes(zone.nodes || []);
          store.setEdges(zone.edges || []);
        }

        const nextZones = importedZones.map((z) => ({ id: z.id, label: z.label ?? z.id }));
        const nextSelectedId =
          importedSelectedId && nextZones.some((z) => z.id === importedSelectedId)
            ? importedSelectedId
            : nextZones[0]?.id;

        useZoneStore.setState({ zones: nextZones, selectedId: nextSelectedId, selectedFta: importedSelectedFta, projectName: data.projectName || "Untitled Project" });
        //fta
        if (importedFtaDump.length > 0) {
          for (const it of importedFtaDump) {
            if (!it?.zoneId || !it?.taskId) continue;
            const hook = getFtaStoreHook(it.zoneId, it.taskId);
            const st = hook.getState();
            st.setNodes(it.nodes || []);
            st.setEdges(it.edges || []);
            if (typeof st.setAllCauseChecks === "function") {
              st.setAllCauseChecks(it.causeChecks || {});
            } else if (st.setCauseChecked && it.causeChecks) {
              // fallback if you didn’t add setAllCauseChecks
              for (const [k, v] of Object.entries(it.causeChecks)) {
                st.setCauseChecked(k, !!v);
              }
            }
          }
        }
        // 4) Auto-layout selected zone (if any)
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

        // 5) Notify diagram to fitView (if you listen for this)
        try {
          window.dispatchEvent(new CustomEvent("graph-imported"));
        } catch { }

        toast.success("Project imported successfully. Current data was replaced.");
        console.log("Import finished:", {
          zones: useZoneStore.getState().zones,
          selectedId: useZoneStore.getState().selectedId,
        });
        setTimeout(() => {
          window.location.reload(); // 🔁 hard refresh after success
        }, 1200);
      } catch (err: any) {
        console.error("Import failed:", err);
        // IMPORTANT: we didn’t clear anything unless parsing/validation succeeded,
        // so the user’s current data is still intact.
        toast.error(err?.message || "Import failed. Please check the JSON file.");
      }
    });
  };

  return (
    <header className="bg-background sticky top-0 z-50 w-full border-b">
      <div className="flex h-12 items-center px-6">
        {/* Left: Logo */}
        <Link to="/" className="text-lg font-semibold hover:text-primary transition-colors">
          F-CHIA Tool
        </Link>

        {/* ✅ Center: Project Name Section */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wide">Project:</span>
          {editingName ? (
            <Input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitProjectName}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitProjectName();
                if (e.key === "Escape") {
                  setNameDraft(projectName);
                  setEditingName(false);
                }
              }}
              className="h-7 w-[200px] text-center text-sm"
              autoFocus
              placeholder="Project name"
            />
          ) : (
            <button
              type="button"
              className="text-sm font-semibold text-neutral-700 hover:text-primary"
              title="Click to rename project"
              onClick={() => setEditingName(true)}
            >
              {projectName || "Untitled Project"}
            </button>
          )}
        </div>

        {/* 右侧菜单 */}
        <div className="ml-auto flex items-center gap-3">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>File</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="min-w-[220px] p-2 mt-2">
                    {/* New Project */}
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                      onClick={() => setNewProjectOpen(true)}
                    >
                      New Project…
                    </button>

                    <div className="my-1 h-px bg-border" />
                    {/* Existing items */}
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
                      onClick={() => setConfirmImportOpen(true)}
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
                    <ListItem key="F-CHIA" title="F-CHIA" href="/diagram" />
                    <ListItem key="Table" title="Table" href="/table" />
                    <ListItem key="FTA" title="FTA" href="/fta" />
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
      <AlertDialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new project</AlertDialogTitle>
          </AlertDialogHeader>

          <div className="space-y-3">
            {/* 🆕 Project name input */}
            <div>
              <label className="text-sm font-medium text-foreground">
                Project name
              </label>
              <Input
                placeholder="Type a name for your new project…"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="mt-1"
              />
              {!newProjectName.trim() && (
                <p className="text-xs text-muted-foreground mt-1">
                  This will become your new project’s title.
                </p>
              )}
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                This will <strong>delete all current zones, graphs, and FTAs</strong> from local storage.
              </p>
              <p>
                A new project will be created with a default <em>Base Zone</em> and graph.
              </p>
              <p>
                💡 Tip: Use <strong>File → Export JSON</strong> to back up your work before continuing.
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!nameDraft.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmCreateNewProject}
            >
              Create Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirmImportOpen} onOpenChange={setConfirmImportOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace current project with a JSON file?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">
            This will <strong>clear all current local data</strong> (zones, graphs, FTAs) and replace it
            with the content of the selected file. We recommend exporting a backup first.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setConfirmImportOpen(false);
                fileInputRef.current?.click(); // open file picker
              }}
            >
              Choose file &amp; replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}