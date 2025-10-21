// Header.tsx
import { type Edge } from "@xyflow/react";
import { getNodesBounds, getViewportForBounds, type Node as RFNode } from "@xyflow/react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import autoTable, { type RowInput, type CellInput } from "jspdf-autotable";
import type { IR } from "@/common/ir";
import { useRef, useState, useEffect } from "react";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { graphToIR } from "@/common/graphToIR";
import { deriveRowSpans } from "@/common/deriveRowSpans";
import ExportTablePDFButton from "@/components/ExportTablePDFButton";
import DownloadButton from "@/components/DownloadButton";
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

function HeaderExportActions() {
  const { pathname } = useLocation();

  // Project / Zone
  const projectName = useZoneStore((s) => s.projectName);
  const zoneId: string | undefined = useZoneStore((s) => s.selectedId);
  const zones = useZoneStore((s) => s.zones);
  const zoneLabel = zones.find((z) => z.id === zoneId)?.label ?? zoneId ?? "Unnamed Zone";

  // Graph from current zone
  const storeHook = useMemo(() => (zoneId ? getGraphStoreHook(zoneId) : null), [zoneId]);
  const nodes = storeHook ? storeHook((state) => state.nodes) : [];
  const edges = storeHook ? storeHook((state) => state.edges) : [];

  // Zone description from zone node (if present)
  const zoneDescription: string = useMemo(() => {
    const zoneNode = Array.isArray(nodes) ? nodes.find((n: any) => n?.type === "zone") : undefined;
    return zoneNode?.data?.content ?? "";
  }, [nodes]);

  // Table data (derived IR with rowSpans)
  const defaultValues = useMemo(() => {
    try {
      const ir = graphToIR(nodes, edges);
      return deriveRowSpans(ir);
    } catch {
      return { tasks: [] } as any;
    }
  }, [nodes, edges]);

  // Guard: if no zone yet, only show PDF (it will handle empty data); keep Flow button off.
  const canShowFlowButton = pathname.startsWith("/diagram");

  return (
    <div className="flex items-center gap-2">
      {/* Flow PNG export only on Diagram page to avoid React Flow provider error */}
      {canShowFlowButton ? <DownloadButton /> : null}

      {/* Structured text-based PDF (tables) */}
      <ExportTablePDFButton
        data={defaultValues}
        projectName={projectName}
        zoneLabel={zoneLabel}
        zoneDescription={zoneDescription}
      />
    </div>
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

  // Export PDF (Flow + Tables)
  const handleExportCombinedPDF = () => {
    const { projectName, selectedId, zones } = useZoneStore.getState();
    const zoneId = selectedId;
    if (!zoneId) {
      toast.error("No zone selected");
      return;
    }
    const zone = zones.find(z => z.id === zoneId);
    const zoneLabel = zone?.label || zoneId;

    // Build IR/table data
    const graphState = getGraphStoreHook(zoneId).getState();
    const nodes = graphState.nodes || [];
    const edges = graphState.edges || [];
    const ir: IR = graphToIR(nodes, edges);
    const data = deriveRowSpans(ir);

    // zone description from graph
    const zoneNode = (nodes || []).find((n: any) => n.type === "zone");
    const zoneDescription = zoneNode?.data?.content || "";

    // ---- 1) Capture Flow Image (dataURL) using viewport transform ----
    const imageWidth = 1920;
    const imageHeight = 1080;
    const DPR = Math.min(3, window.devicePixelRatio || 1);

    // compute viewport from nodes bounds
    const rfNodes: RFNode[] = (nodes || []).map((n: any) => ({
      id: n.id,
      position: n.position || { x: 0, y: 0 },
      width: (n.width as number) || 180,
      height: (n.height as number) || 80,
      data: n.data,
      type: n.type,
      selectable: false,
      dragHandle: undefined,
      dragging: false,
      hidden: false,
      selected: false,
    })) as any;

    const bounds = getNodesBounds(rfNodes);
    const viewport = getViewportForBounds(bounds, imageWidth, imageHeight, 0.5, 2);

    const viewportEl = document.querySelector(".react-flow__viewport") as HTMLElement | null;
    if (!viewportEl) {
      toast.error("Flow canvas not found on this page");
      return;
    }

    // Create overlay badge (project + zone) in the flow for capture
    const prevPos = viewportEl.style.position;
    if (!prevPos) viewportEl.style.position = "relative";

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.padding = "3px 12px";
    overlay.style.borderRadius = "3px";
    overlay.style.background = "rgba(243, 244, 246, 0.95)"; // gray-100
    overlay.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
    overlay.style.backdropFilter = "blur(2px)";
    overlay.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
    overlay.style.pointerEvents = "none";
    overlay.style.lineHeight = "1.2";
    overlay.style.maxWidth = "70%";
    overlay.style.wordBreak = "break-word";
    overlay.style.zIndex = "9999";

    const t1 = document.createElement("div");
    t1.textContent = projectName || "Untitled Project";
    t1.style.fontWeight = "700";
    t1.style.fontSize = "14px";
    const t2 = document.createElement("div");
    t2.textContent = `Zone: ${zoneLabel}`;
    t2.style.fontSize = "12px";
    t2.style.color = "#444";
    overlay.appendChild(t1);
    overlay.appendChild(t2);
    viewportEl.appendChild(overlay);

    toPng(viewportEl, {
      backgroundColor: "#ffffff",
      width: imageWidth,
      height: imageHeight,
      pixelRatio: DPR,
      cacheBust: true,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transformOrigin: "0 0",
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        imageRendering: "crisp-edges",
      } as any,
    })
      .then((dataUrl) => {
        // ---- 2) Build PDF with header, image, then tables ----
        const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginX = 10;
        const headerBottomY = 20;   // line at y=20
        const contentTop = 24;      // start content after header
        const footerGap = 10;

        // Header
        const title = "Project Report";
        const sub = `Project: ${projectName || "Untitled Project"}  •  Zone: ${zoneLabel}`;
        const dateStr = new Date().toLocaleString();
        const drawHeader = () => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text(title, marginX, 12, { align: "left" });

          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.text(sub, marginX, 18, { align: "left" });

          doc.setTextColor(120);
          doc.text(dateStr, pageWidth - marginX, 12, { align: "right" });
          doc.setTextColor(0);

          doc.setDrawColor(220);
          doc.line(marginX, headerBottomY, pageWidth - marginX, headerBottomY);
        };

        const drawCenteredTitle = (text: string, y: number, isLightHeader?: boolean) => {
          if (isLightHeader) doc.setTextColor(107); // gray-600
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text(text, pageWidth / 2, y, { align: "center" });
          doc.setTextColor(0);
        };

        drawHeader();

        // available drawing box below the header to bottom
        const availH = pageHeight - contentTop - footerGap;
        const maxW = pageWidth - marginX * 2;

        // image native ratio
        const imgW = imageWidth;
        const imgH = imageHeight;

        // scale to fill height but never overflow width
        const scaleH = availH / imgH;
        const scaleW = maxW / imgW;
        const scale = Math.min(scaleH, scaleW);

        const finalW = imgW * scale;
        const finalH = imgH * scale;
        const imgX = marginX + (maxW - finalW) / 2;
        const imgY = contentTop;

        doc.addImage(dataUrl, "PNG", imgX, imgY, finalW, finalH);

        // ---- Second page: center the tables (and titles) horizontally ----
        doc.addPage("a4", "landscape");
        drawHeader();

        // helper to center a given desired table width
        const centerMargin = (desiredWidth: number) => {
          const clamped = Math.min(desiredWidth, pageWidth - marginX * 2);
          const left = (pageWidth - clamped) / 2;
          return { left, right: left };
        };

        // ── 1) Function-Centric Hazard Identification (title + optional description)
        let cursorY = contentTop;
        drawCenteredTitle("Function-Centric Hazard Identification", cursorY, true);
        cursorY += 6;

        if (zoneDescription) {
          doc.setFontSize(9);
          doc.setTextColor(90);
          const descLines = doc.splitTextToSize(
            `Zone Description: ${zoneDescription}`,
            pageWidth * 0.9  // wrap width relative to page
          );
          // horizontally center the description by computing its x start
          const descBlockWidth = Math.min(pageWidth * 0.9, pageWidth - marginX * 2);
          const descLeft = (pageWidth - descBlockWidth) / 2;
          doc.text(descLines, descLeft, cursorY);
          doc.setTextColor(0);
          cursorY += descLines.length * 4 + 2;
        }

        // Build rows from data (mirrors your UI with rowSpan)
        const rows: RowInput[] = [];
        (data.tasks || []).forEach(task => {
          const taskName = task.taskName || "";
          const taskRowSpan = Math.max(1, task.rowSpan || 1);
          const fns = task.functions || [];
          if (!fns.length) {
            rows.push([{ content: taskName, rowSpan: 1 } as CellInput, "(No function)", "", "", "", "", "", "", "", ""]);
            return;
          }
          let taskPrinted = false;
          fns.forEach(fn => {
            const fnName = fn.functionName || "";
            const fnRowSpan = Math.max(1, fn.rowSpan || 1);
            const reals = fn.realizations || [];
            if (!reals.length) {
              rows.push([
                taskPrinted ? "" : ({ content: taskName, rowSpan: taskRowSpan } as CellInput),
                { content: fnName, rowSpan: 1 } as CellInput,
                "(No realization)", "", "", "", "", "", "", "",
              ]);
              taskPrinted = true;
              return;
            }
            let fnPrinted = false;
            reals.forEach(real => {
              const realName = real.realizationName || "";
              const realRowSpan = Math.max(1, real.rowSpan || 1);
              const props = real.properties || [];
              if (!props.length) {
                rows.push([
                  taskPrinted ? "" : ({ content: taskName, rowSpan: taskRowSpan } as CellInput),
                  fnPrinted ? "" : ({ content: fnName, rowSpan: fnRowSpan } as CellInput),
                  { content: realName, rowSpan: 1 } as CellInput,
                  "(No property)", "", "", "", "", "", "",
                ]);
                taskPrinted = true; fnPrinted = true;
                return;
              }
              let realPrinted = false;
              props.forEach(prop => {
                const propText = (prop.properties || []).filter(Boolean).join("\n");
                const propRowSpan = Math.max(1, prop.rowSpan || 1);
                const inters = prop.interpretations || [];
                if (!inters.length) {
                  rows.push([
                    taskPrinted ? "" : ({ content: taskName, rowSpan: taskRowSpan } as CellInput),
                    fnPrinted ? "" : ({ content: fnName, rowSpan: fnRowSpan } as CellInput),
                    realPrinted ? "" : ({ content: realName, rowSpan: realRowSpan } as CellInput),
                    { content: propText || "(No property text)", rowSpan: 1 } as CellInput,
                    "(No interpretation)", "", "", "", "", "",
                  ]);
                  taskPrinted = true; fnPrinted = true; realPrinted = true;
                  return;
                }
                let propPrinted = false;
                inters.forEach(inter => {
                  const guide = inter.guideWord || "";
                  const list = (arr?: any[]) => (arr || []).map((x, i) => x?.text ? `${i + 1}. ${x.text}` : "").filter(Boolean).join("\n");
                  const deviations = list(inter.deviations);
                  const causes = list(inter.causes);
                  const consequences = list(inter.consequences);
                  const requirements = list(inter.requirements);
                  const iso = (inter.isoMatches || []).map((i: any) => i.iso_number || i.title || "").filter(Boolean).join(", ");

                  rows.push([
                    taskPrinted ? "" : ({ content: taskName, rowSpan: taskRowSpan } as CellInput),
                    fnPrinted ? "" : ({ content: fnName, rowSpan: fnRowSpan } as CellInput),
                    realPrinted ? "" : ({ content: realName, rowSpan: realRowSpan } as CellInput),
                    propPrinted ? "" : ({ content: propText, rowSpan: propRowSpan } as CellInput),
                    guide, deviations, causes, consequences, requirements, iso,
                  ]);
                  taskPrinted = true; fnPrinted = true; realPrinted = true; propPrinted = true;
                });
              });
            });
          });
        });

        autoTable(doc, {
          startY: cursorY,
          theme: "grid",
          head: [[
            "Task", "Function", "Realization", "Property",
            "Guide Word", "Deviations", "Causes", "Consequences", "Requirements", "ISO",
          ]],
          body: rows,
          styles: {
            font: "helvetica",
            fontSize: 9,
            cellPadding: 2,
            valign: "top",
            overflow: "linebreak",
          },
          // Only the original column header row uses gray-50
          headStyles: { fillColor: [249, 250, 251], textColor: 20, fontStyle: "bold" },
          columnStyles: {
            0: { cellWidth: 24 }, 1: { cellWidth: 24 }, 2: { cellWidth: 24 }, 3: { cellWidth: 28 },
            4: { cellWidth: 20 }, 5: { cellWidth: 34 }, 6: { cellWidth: 34 }, 7: { cellWidth: 34 },
            8: { cellWidth: 42 }, 9: { cellWidth: 24 },
          },
          // Center the table block on the page
          tableWidth: pageWidth * 0.92,
          margin: centerMargin(pageWidth * 0.92),
          didDrawPage: () => drawHeader(),
        });
        // If there’s room DSM stays on this page; else it flows to the next
        const afterFirstTableY = (doc as any).lastAutoTable.finalY + 8;

        // ── 2) DSM (title centered + table centered)
        drawCenteredTitle("Function–Requirement DSM", afterFirstTableY, true);

        // build DSM pieces (your existing DSM build code) …
        const dsmTitleBottomY = afterFirstTableY + 6;
        // If there is room, DSM stays on same page; otherwise it flows naturally
        // --- Second table: Function–Requirement DSM ---
        const buildDSM = (irData: IR) => {
          const pairs: { functionId: string; functionName: string; requirementId: string; requirementText: string }[] = [];
          (irData.tasks || []).forEach(t => {
            (t.functions || []).forEach(fn => {
              const seen = new Set<string>();
              (fn.realizations || []).forEach(r => {
                (r.properties || []).forEach(p => {
                  (p.interpretations || []).forEach(i => {
                    (i.requirements || []).forEach(req => {
                      const key = `${fn.id}|${req.id}`;
                      if (seen.has(key)) return;
                      seen.add(key);
                      pairs.push({
                        functionId: fn.id, functionName: fn.functionName, requirementId: req.id, requirementText: req.text,
                      });
                    });
                  });
                });
              });
            });
          });
          const fnOrder: { id: string; name: string }[] = [];
          const reqOrder: { id: string; text: string }[] = [];
          const fnSeen = new Set<string>();
          const reqSeen = new Set<string>();
          pairs.forEach(p => {
            if (!fnSeen.has(p.functionId)) { fnSeen.add(p.functionId); fnOrder.push({ id: p.functionId, name: p.functionName }); }
            if (!reqSeen.has(p.requirementId)) { reqSeen.add(p.requirementId); reqOrder.push({ id: p.requirementId, text: p.requirementText }); }
          });
          const hit = new Set<string>();
          pairs.forEach(p => hit.add(`${p.functionId}|${p.requirementId}`));
          return { fnOrder, reqOrder, hit };
        };

        const { fnOrder, reqOrder, hit } = buildDSM(ir);

        // Title centered
        const afterFirst = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : (doc as any).lastAutoTable?.finalY + 8 || doc.previousAutoTable?.finalY + 8 || 30;
        drawCenteredTitle("Function–Requirement DSM", afterFirst, true);

        // Build DSM body: first col = function names; subsequent cols = X/blank
        const dsmHead = [["Function \\ Requirement", ...reqOrder.map(r => r.text || r.id || "")]];
        const dsmBody: RowInput[] = fnOrder.length
          ? fnOrder.map(fn => [
            fn.name || "(unnamed function)",
            ...reqOrder.map(r => (hit.has(`${fn.id}|${r.id}`) ? "X" : "")),
          ])
          : [["(No functions)"]];

        autoTable(doc, {
          startY: dsmTitleBottomY,
          theme: "grid",
          head: [["Function \\ Requirement", ...reqOrder.map(r => r.text || r.id || "")]],
          body: fnOrder.length
            ? fnOrder.map(fn => [
              fn.name || "(unnamed function)",
              ...reqOrder.map(r => (hit.has(`${fn.id}|${r.id}`) ? "X" : "")),
            ])
            : [["(No functions)"]],
          styles: { font: "helvetica", fontSize: 9, cellPadding: 2, valign: "top", overflow: "linebreak" },
          headStyles: { fillColor: [243, 244, 246], textColor: 20, fontStyle: "bold" }, // gray-100 for DSM table head
          columnStyles: {
            0: { cellWidth: 36 },
            ...Object.fromEntries(reqOrder.map((_, idx) => [idx + 1, { cellWidth: 24 }]))
          },
          // Center the DSM table on the page
          tableWidth: pageWidth * 0.92,
          margin: centerMargin(pageWidth * 0.92),
          didDrawPage: () => drawHeader(),
        });

        // Save
        const safe = (s: string) => (s || "").replace(/[^\w-]+/g, "_");
        const ts = new Date().toLocaleString().replace(/[^\dA-Za-z]+/g, "-");
        const name = `${safe(projectName || "Project")}_${safe(zoneLabel)}_${ts}.pdf`;
        doc.save(name);
      })
      .catch((err) => {
        console.error("PNG capture failed:", err);
        toast.error("Failed to capture flow image");
      })
      .finally(() => {
        // cleanup overlay after a short delay to ensure capture finished
        setTimeout(() => {
          try { viewportEl.removeChild(overlay); } catch { }
          if (!prevPos) viewportEl.style.position = "";
        }, 300);
      });
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
          <HeaderExportActions />
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
                      onClick={handleExportCombinedPDF}
                    >
                      Export PDF (Flow + Tables)
                    </button>
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