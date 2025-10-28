// Header.tsx
import { type Edge } from "@xyflow/react";
import { getNodesBounds, getViewportForBounds, type Node as RFNode } from "@xyflow/react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import autoTable, { type RowInput, type CellInput } from "jspdf-autotable";
import type { IR } from "@/common/ir";
import { useRef, useState, useEffect } from "react";
import { graphToIR } from "@/common/graphToIR";
import { deriveRowSpans } from "@/common/deriveRowSpans";
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
import { Progress } from "@/components/ui/progress";
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
import { useNavigate, useLocation } from "react-router-dom";
declare global {
  interface Window {
    FlowCapture?: {
      zoneId?: string;
      ready: boolean;
      capture: (opts?: {
        width?: number;
        height?: number;
        pixelRatio?: number;
        bg?: string;
      }) => Promise<string>;
    };
    appNavigate?: (to: any, opts?: any) => void;
  }
}
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


const flush = () => new Promise<void>((r) => setTimeout(r, 0));
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function once(type: string, predicate: (e: any) => boolean, timeoutMs = 10000) {
  return new Promise<any>((resolve, reject) => {
    const on = (e: any) => {
      if (predicate(e)) {
        cleanup();
        resolve(e.detail);
      }
    };
    const to = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout waiting for ${type}`));
    }, timeoutMs);
    const cleanup = () => {
      clearTimeout(to);
      window.removeEventListener(type, on as any);
    };
    window.addEventListener(type, on as any, { once: true });
  });
}

// Read *all* FTA entries saved by your app (same shape you’ve been using)

function readAllFtasFromLocalStorage(): FtaDumpItem[] {
  const out: FtaDumpItem[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) || "";
    if (!key.startsWith("fta-")) continue;
    // key format: fta-${zoneId}::${taskId}
    const id = key.slice(4);
    const [zoneId, taskId] = id.split("::");
    if (zoneId && taskId) out.push({ zoneId, taskId });
  }
  return out;
}

export default function Header() {
  const [exporting, setExporting] = useState(false);
  const [exportPct, setExportPct] = useState(0);
  const [exportStep, setExportStep] = useState<string>("");

  const flush = () => new Promise<void>((r) => setTimeout(r, 0));
  // 让 input 持久存在于 Header 根部
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [confirmImportOpen, setConfirmImportOpen] = useState(false);

  const projectName = useZoneStore((state) => state.projectName);
  const setProjectName = useZoneStore((state) => state.setProjectName);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(projectName);
  const [newProjectName, setNewProjectName] = useState("");

  const [exportingFta, setExportingFta] = useState(false);
  const [exportPctFta, setExportPctFta] = useState(0);
  const [exportStepFta, setExportStepFta] = useState("");
  const location = useLocation();
  useEffect(() => setNameDraft(projectName), [projectName]);
  const navigate = useNavigate();
  useEffect(() => {
    (window as any).appNavigate = navigate;
  }, [navigate]);
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
    const safeName = projectName?.trim() ? projectName.trim().replace(/[^\w]+/g, "_") : "project";
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
    const viewport = getViewportForBounds(bounds, imageWidth, imageHeight, 0.5, 2, 0);

    const viewportEl = document.querySelector(".react-flow__viewport") as HTMLElement | null;
    if (!viewportEl) {
      toast.error("Flow canvas not found on this page");
      return;
    }

    // Create overlay badge (project + zone) in the flow for capture
    const prevPos = viewportEl.style.position;
    if (!prevPos) viewportEl.style.position = "relative";

    // const overlay = document.createElement("div");
    // overlay.style.position = "fixed";
    // overlay.style.top = "0";
    // overlay.style.left = "0";
    // overlay.style.padding = "3px 12px";
    // overlay.style.borderRadius = "3px";
    // overlay.style.background = "rgba(243, 244, 246, 0.95)"; // gray-100
    // overlay.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
    // overlay.style.backdropFilter = "blur(2px)";
    // overlay.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
    // overlay.style.pointerEvents = "none";
    // overlay.style.lineHeight = "1.2";
    // overlay.style.maxWidth = "70%";
    // overlay.style.wordBreak = "break-word";
    // overlay.style.zIndex = "9999";

    // const t1 = document.createElement("div");
    // t1.textContent = projectName || "Untitled Project";
    // t1.style.fontWeight = "700";
    // t1.style.fontSize = "14px";
    // const t2 = document.createElement("div");
    // t2.textContent = `Zone: ${zoneLabel}`;
    // t2.style.fontSize = "12px";
    // t2.style.color = "#444";
    // overlay.appendChild(t1);
    // overlay.appendChild(t2);
    // viewportEl.appendChild(overlay);


    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = `${imageWidth}px`;
    overlay.style.height = `${imageHeight}px`;
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '9999';
    overlay.style.transformOrigin = '0 0';
    overlay.style.transform = `translate(${-viewport.x}px, ${-viewport.y}px) scale(${1 / viewport.zoom})`;

    const badge = document.createElement('div');
    badge.style.position = 'fixed';
    badge.style.top = '0';
    badge.style.left = '0';
    badge.style.padding = '3px 12px';
    badge.style.borderRadius = '3px';
    badge.style.background = 'rgba(240, 240, 240, 0.95)';
    badge.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
    badge.style.backdropFilter = 'blur(2px)';
    badge.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';
    badge.style.pointerEvents = 'none';
    badge.style.lineHeight = '1.2';
    badge.style.maxWidth = '60%';
    badge.style.wordBreak = 'break-word';

    const title = document.createElement('div');
    title.textContent = projectName || 'Untitled Project';
    title.style.fontWeight = '700';
    title.style.fontSize = '14px';

    const subtitle = document.createElement('div');
    subtitle.textContent = `Zone: ${zoneLabel ?? selectedId ?? 'Unknown'}`;
    subtitle.style.fontSize = '12px';
    subtitle.style.color = '#555';

    console.log('projectName', projectName, 'zoneName', zoneLabel);
    badge.appendChild(title);
    badge.appendChild(subtitle);
    overlay.appendChild(badge);
    viewportEl.appendChild(overlay);
    toPng(viewportEl, {
      backgroundColor: '#ffffff',
      width: imageWidth,
      height: imageHeight,
      pixelRatio: DPR,
      cacheBust: true,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transformOrigin: '0 0',
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        // text render hints (helps clarity a bit)
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        imageRendering: 'crisp-edges',
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

        // Build rows from data (rowSpan logic) — identical to ExportStructuredPDFButton
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
              const row: RowInput = [];
              if (!taskPrinted) row.push({ content: taskName, rowSpan: taskRowSpan } as CellInput);
              row.push({ content: fnName, rowSpan: 1 } as CellInput);
              row.push("(No realization)");
              row.push(""); // Property
              row.push(""); // Guide Word
              row.push(""); // Deviations
              row.push(""); // Causes
              row.push(""); // Consequences
              row.push(""); // Requirements
              row.push(""); // ISO
              rows.push(row);
              taskPrinted = true;
              return;
            }
            let fnPrinted = false;
            reals.forEach(real => {
              const realName = real.realizationName || "";
              const realRowSpan = Math.max(1, real.rowSpan || 1);
              const props = real.properties || [];
              if (!props.length) {
                const row: RowInput = [];
                if (!taskPrinted) row.push({ content: taskName, rowSpan: taskRowSpan } as CellInput);
                if (!fnPrinted) row.push({ content: fnName, rowSpan: fnRowSpan } as CellInput);
                row.push({ content: realName, rowSpan: 1 } as CellInput);
                row.push("(No property)");
                row.push(""); // Guide Word
                row.push(""); // Deviations
                row.push(""); // Causes
                row.push(""); // Consequences
                row.push(""); // Requirements
                row.push(""); // ISO
                rows.push(row);
                taskPrinted = true; fnPrinted = true;
                return;
              }
              let realPrinted = false;
              props.forEach(prop => {
                const propText = (prop.properties || []).filter(Boolean).join("\n");
                const propRowSpan = Math.max(1, prop.rowSpan || 1);
                const inters = prop.interpretations || [];
                if (!inters.length) {
                  const row: RowInput = [];
                  if (!taskPrinted) row.push({ content: taskName, rowSpan: taskRowSpan } as CellInput);
                  if (!fnPrinted) row.push({ content: fnName, rowSpan: fnRowSpan } as CellInput);
                  if (!realPrinted) row.push({ content: realName, rowSpan: realRowSpan } as CellInput);
                  row.push({ content: propText || "(No property text)", rowSpan: 1 } as CellInput);
                  row.push("(No interpretation)");
                  row.push(""); // Deviations
                  row.push(""); // Causes
                  row.push(""); // Consequences
                  row.push(""); // Requirements
                  row.push(""); // ISO
                  rows.push(row);
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

                  const row: RowInput = [];
                  if (!taskPrinted) row.push({ content: taskName, rowSpan: taskRowSpan } as CellInput);
                  if (!fnPrinted) row.push({ content: fnName, rowSpan: fnRowSpan } as CellInput);
                  if (!realPrinted) row.push({ content: realName, rowSpan: realRowSpan } as CellInput);
                  if (!propPrinted) row.push({ content: propText, rowSpan: propRowSpan } as CellInput);
                  row.push(guide, deviations || "", causes || "", consequences || "", requirements || "", iso || "");
                  rows.push(row);

                  taskPrinted = true; fnPrinted = true; realPrinted = true; propPrinted = true;
                });
              });
            });
          });
        });

        const headRows: (string | CellInput)[][] = [
          [
            {
              content: `Hazard Zone: ${zoneLabel || "Unnamed Zone"}`,
              colSpan: 10,
              styles: { halign: "center", fontStyle: "bold", fillColor: [229, 231, 235] }, // gray-200
            } as CellInput,
          ],
          [
            {
              content:
                zoneDescription && zoneDescription.trim().length > 0
                  ? `Zone Description: ${zoneDescription}`
                  : "Zone Description: —",
              colSpan: 10,
              styles: { halign: "left", fontStyle: "normal", fillColor: [243, 244, 246] }, // gray-100
            } as CellInput,
          ],
          [
            { content: "Task", styles: { fillColor: [249, 250, 251] } }, // gray-50
            { content: "Function", styles: { fillColor: [249, 250, 251] } },
            { content: "Realization", styles: { fillColor: [249, 250, 251] } },
            { content: "Property", styles: { fillColor: [249, 250, 251] } },
            { content: "Guide Word", styles: { fillColor: [249, 250, 251] } },
            { content: "Deviations", styles: { fillColor: [249, 250, 251] } },
            { content: "Causes", styles: { fillColor: [249, 250, 251] } },
            { content: "Consequences", styles: { fillColor: [249, 250, 251] } },
            { content: "Requirements", styles: { fillColor: [249, 250, 251] } },
            { content: "ISO", styles: { fillColor: [249, 250, 251] } },
          ],
        ];

        // Title outside table (centered)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        const fchiTitle = "Function-Centric Hazard Identification";
        const fchiTitleY = 24;
        doc.text(fchiTitle, pageWidth / 2, fchiTitleY, { align: "center" });
        const firstTableStartY = fchiTitleY + 6;

        autoTable(doc, {
          theme: "grid",
          startY: firstTableStartY,
          head: headRows,
          body: rows,
          styles: { font: "helvetica", fontSize: 9, cellPadding: 2, valign: "top", overflow: "linebreak" },
          headStyles: { fillColor: [243, 244, 246], textColor: 20, fontStyle: "bold" },
          columnStyles: {
            0: { cellWidth: 22 }, 1: { cellWidth: 22 }, 2: { cellWidth: 22 }, 3: { cellWidth: 26 },
            4: { cellWidth: 18 }, 5: { cellWidth: 32 }, 6: { cellWidth: 32 }, 7: { cellWidth: 32 },
            8: { cellWidth: 40 }, 9: { cellWidth: 30 },
          },
          margin: { left: 10, right: 10 },
          tableLineColor: 200,
          tableLineWidth: 0.1,
          horizontalPageBreak: false,
          didDrawPage: () => {
            drawHeader();
            const pageNumber = doc.internal.getNumberOfPages();
            const total = doc.getNumberOfPages();
            // footer same as your working button
            doc.setDrawColor(220);
            doc.line(10, pageHeight - 12, pageWidth - 10, pageHeight - 12);
            doc.setDrawColor(0);
            doc.setFontSize(10);
            doc.text(`Page ${pageNumber} / ${total}`, pageWidth - 10, pageHeight - 6, { align: "right" });
          },
        });

        // ---------- DSM PAGE (match your DSM layout) ----------
        const buildDSMMatrixFromIR = (irData: IR) => {
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

        const { fnOrder, reqOrder, hit } = buildDSMMatrixFromIR(ir);

        const prevTable = (doc as any).lastAutoTable;
        const firstPageNoBeforeDSM = doc.internal.getNumberOfPages();

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        const dsmTitle = "Function–Requirement DSM";
        const dsmTitleY = Math.max(24, ((prevTable?.finalY as number) ?? 24) + 10);
        doc.text(dsmTitle, pageWidth / 2, dsmTitleY, { align: "center" });
        const startYDSM = dsmTitleY + 6;

        const dsmHead: (string | CellInput)[][] = [
          ["Function \\\\ Requirement", ...reqOrder.map(r => (r.text || `[${r.id}]`))]
        ];
        const dsmBody: RowInput[] = fnOrder.map(fn => {
          const row: (string | CellInput)[] = [];
          row.push(fn.name || "(unnamed function)");
          if (reqOrder.length === 0) {
            row.push("(No requirements)");
          } else {
            for (const req of reqOrder) row.push(hit.has(`${fn.id}|${req.id}`) ? "X" : "");
          }
          return row as RowInput;
        });

        // column widths & centered block identical to your working code
        const firstColWidth = 60;
        const minOtherCol = 12;
        const maxOtherCol = 28;
        const computedOther = Math.floor((pageWidth - 20 - firstColWidth) / Math.max(1, reqOrder.length));
        const otherColWidth = Math.min(maxOtherCol, Math.max(minOtherCol, computedOther));
        const dsmColumnStyles: Record<number, any> = { 0: { cellWidth: firstColWidth } };
        for (let i = 1; i <= reqOrder.length; i++) {
          dsmColumnStyles[i] = { cellWidth: otherColWidth, halign: "center", valign: "middle" };
        }

        autoTable(doc, {
          theme: "grid",
          startY: startYDSM,
          head: dsmHead,
          body: dsmBody,
          styles: { font: "helvetica", fontSize: 9, cellPadding: 2, overflow: "linebreak", valign: "top" },
          headStyles: { fillColor: [243, 244, 246], textColor: 20, fontStyle: "bold" },
          columnStyles: dsmColumnStyles,
          margin: {
            left: (pageWidth - (firstColWidth + reqOrder.length * otherColWidth)) / 2,
            right: 10,
          },
          didDrawPage: () => {
            const current = doc.internal.getCurrentPageInfo().pageNumber;
            if (current > firstPageNoBeforeDSM) {
              doc.setFont("helvetica", "bold");
              doc.setFontSize(12);
              doc.text("Function–Requirement DSM", pageWidth / 2, 24, { align: "center" });
            }
            // Footer on every page
            const total = doc.getNumberOfPages();
            doc.setDrawColor(220);
            doc.line(10, pageHeight - 12, pageWidth - 10, pageHeight - 12);
            doc.setDrawColor(0);
            doc.setFontSize(10);
            doc.text(`Page ${current} / ${total}`, pageWidth - 10, pageHeight - 6, { align: "right" });
          },
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
  // All Zones

  const handleExportAllZonesOnTheFly = async () => {
    const { zones, projectName } = useZoneStore.getState();
    if (!zones.length) {
      toast.error("No zones to export");
      return;
    }
    const returnTo = location.pathname;

    // one-time event helper
    const once = (type: string, predicate: (e: any) => boolean, timeoutMs = 15000) =>
      new Promise<any>((resolve, reject) => {
        const on = (e: any) => { if (predicate(e)) { cleanup(); resolve(e.detail); } };
        const to = setTimeout(() => { cleanup(); reject(new Error(`Timeout waiting for ${type}`)); }, timeoutMs);
        const cleanup = () => { clearTimeout(to); window.removeEventListener(type, on as any); };
        window.addEventListener(type, on as any, { once: true });
      });


    setExporting(true);
    setExportPct(0);
    setExportStep("Preparing…");
    await flush();


    try {

      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const marginX = 10;
      const total = zones.length;
      const drawHeader = (zoneLabel: string) => {
        const t = `Project: ${projectName || "Untitled Project"}    •    Zone: ${zoneLabel}`;
        const dateStr = new Date().toLocaleString();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(t, marginX, 12);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(120);
        doc.text(dateStr, pageW - marginX, 12, { align: "right" });
        doc.setTextColor(0);
        doc.setDrawColor(220);
        doc.line(marginX, 20, pageW - marginX, 20);
      };
      const drawFooter = () => {
        const current = doc.internal.getCurrentPageInfo().pageNumber;
        const total = doc.getNumberOfPages();
        doc.setDrawColor(220);
        doc.line(10, pageH - 12, pageW - 10, pageH - 12);
        doc.setDrawColor(0);
        doc.setFontSize(10);
        doc.text(`Page ${current} / ${total}`, pageW - 10, pageH - 6, { align: "right" });
      };

      let first = true;

      for (let i = 0; i < total; i++) {
        const z = zones[i];
        const zoneLabel = z.label || z.id;
        setExportStep(`Loading diagram for "${zoneLabel}"…`);
        setExportPct(Math.round((i / total) * 100));
        await flush();
        // switch zone + go to /diagram
        useZoneStore.setState({ selectedId: z.id });
        navigate("/diagram", { replace: true });

        // wait until Diagram says it's truly ready for THIS zone
        try {
          await once("flow:ready", (e) => e?.detail?.zoneId === z.id, 15000);
        } catch {
          // fallback: give a little extra time (layout/measure)
          await new Promise((r) => setTimeout(r, 800));
        }
        // tiny settle to ensure layout applied
        await new Promise((r) => setTimeout(r, 400));

        setExportStep(`Capturing diagram for "${zoneLabel}"…`);
        await flush();

        // capture at native 1920x1080 using the in-page FlowCapture
        const dataUrl = await window.FlowCapture!.capture({
          width: 1920,
          height: 1080,
          pixelRatio: Math.min(3, window.devicePixelRatio || 1),
          bg: "#ffffff",
        });

        if (!first) doc.addPage("a4", "landscape");
        first = false;

        // --- Page 1: Diagram ---
        drawHeader(z.label || z.id);
        const topY = 24, footerGap = 10;
        const maxW = pageW - marginX * 2;
        const maxH = pageH - topY - footerGap;
        const aspect = 1920 / 1080;
        let drawW = maxH * aspect, drawH = maxH;
        if (drawW > maxW) { drawW = maxW; drawH = drawW / aspect; }
        const imgX = marginX + (maxW - drawW) / 2;
        doc.addImage(dataUrl, "PNG", imgX, topY, drawW, drawH);
        drawFooter();

        setExportPct(Math.round(((i + 0.5) / total) * 100));
        setExportStep(`Building tables for "${zoneLabel}"…`);
        await flush();

        // --- Page 2: Tables (identical to ExportStructuredPDFButton) ---
        doc.addPage("a4", "landscape");
        drawHeader(z.label || z.id);

        const graph = getGraphStoreHook(z.id).getState();
        const ir = graphToIR(graph.nodes || [], graph.edges || []);
        const formLike = deriveRowSpans(ir);

        // build rows with rowSpan (identical to ExportStructuredPDFButton)
        const rows: RowInput[] = [];
        (formLike.tasks || []).forEach((task: any) => {
          const taskName = task.taskName || "";
          const taskRowSpan = Math.max(1, task.rowSpan || 1);
          const fns = task.functions || [];

          if (!fns.length) {
            rows.push([{ content: taskName, rowSpan: 1 } as CellInput, "(No function)", "", "", "", "", "", "", "", ""]);
            return;
          }

          let taskPrinted = false;

          fns.forEach((fn: any) => {
            const fnName = fn.functionName || "";
            const fnRowSpan = Math.max(1, fn.rowSpan || 1);
            const reals = fn.realizations || [];

            if (!reals.length) {
              const row: RowInput = [];
              if (!taskPrinted) row.push({ content: taskName, rowSpan: taskRowSpan } as CellInput);
              row.push({ content: fnName, rowSpan: 1 } as CellInput);
              row.push("(No realization)");
              row.push(""); // Property
              row.push(""); // Guide Word
              row.push(""); // Deviations
              row.push(""); // Causes
              row.push(""); // Consequences
              row.push(""); // Requirements
              row.push(""); // ISO
              rows.push(row);
              taskPrinted = true;
              return;
            }

            let fnPrinted = false;

            reals.forEach((real: any) => {
              const realName = real.realizationName || "";
              const realRowSpan = Math.max(1, real.rowSpan || 1);
              const props = real.properties || [];

              if (!props.length) {
                const row: RowInput = [];
                if (!taskPrinted) row.push({ content: taskName, rowSpan: taskRowSpan } as CellInput);
                if (!fnPrinted) row.push({ content: fnName, rowSpan: fnRowSpan } as CellInput);
                row.push({ content: realName, rowSpan: 1 } as CellInput);
                row.push("(No property)");
                row.push(""); // Guide Word
                row.push(""); // Deviations
                row.push(""); // Causes
                row.push(""); // Consequences
                row.push(""); // Requirements
                row.push(""); // ISO
                rows.push(row);
                taskPrinted = true; fnPrinted = true;
                return;
              }

              let realPrinted = false;

              props.forEach((prop: any) => {
                const propText = (prop.properties || []).filter(Boolean).join("\n");
                const propRowSpan = Math.max(1, prop.rowSpan || 1);
                const inters = prop.interpretations || [];

                if (!inters.length) {
                  const row: RowInput = [];
                  if (!taskPrinted) row.push({ content: taskName, rowSpan: taskRowSpan } as CellInput);
                  if (!fnPrinted) row.push({ content: fnName, rowSpan: fnRowSpan } as CellInput);
                  if (!realPrinted) row.push({ content: realName, rowSpan: realRowSpan } as CellInput);
                  row.push({ content: propText || "(No property text)", rowSpan: 1 } as CellInput);
                  row.push("(No interpretation)");
                  row.push(""); // Deviations
                  row.push(""); // Causes
                  row.push(""); // Consequences
                  row.push(""); // Requirements
                  row.push(""); // ISO
                  rows.push(row);
                  taskPrinted = true; fnPrinted = true; realPrinted = true;
                  return;
                }

                let propPrinted = false;

                inters.forEach((inter: any) => {
                  const guide = inter.guideWord || "";
                  const list = (arr?: any[]) => (arr || [])
                    .map((x, i) => (x?.text ? `${i + 1}. ${x.text}` : ""))
                    .filter(Boolean)
                    .join("\n");
                  const deviations = list(inter.deviations);
                  const causes = list(inter.causes);
                  const consequences = list(inter.consequences);
                  const requirements = list(inter.requirements);
                  const iso = (inter.isoMatches || [])
                    .map((i: any) => i.iso_number || i.title || "")
                    .filter(Boolean)
                    .join(", ");

                  const row: RowInput = [];
                  if (!taskPrinted) row.push({ content: taskName, rowSpan: taskRowSpan } as CellInput);
                  if (!fnPrinted) row.push({ content: fnName, rowSpan: fnRowSpan } as CellInput);
                  if (!realPrinted) row.push({ content: realName, rowSpan: realRowSpan } as CellInput);
                  if (!propPrinted) row.push({ content: propText, rowSpan: propRowSpan } as CellInput);
                  row.push(guide, deviations || "", causes || "", consequences || "", requirements || "", iso || "");
                  rows.push(row);

                  taskPrinted = true; fnPrinted = true; realPrinted = true; propPrinted = true;
                });
              });
            });
          });
        });

        if (!rows.length) {
          rows.push(["(No tasks)", "", "", "", "", "", "", "", "", ""]);
        }

        const zoneNode = (graph.nodes || []).find((n: any) => n.type === "zone");
        const zoneDescription = zoneNode?.data?.content || "";

        const headRows: (string | CellInput)[][] = [
          [{ content: `Hazard Zone: ${z.label || z.id}`, colSpan: 10, styles: { halign: "center", fontStyle: "bold", fillColor: [229, 231, 235] } } as CellInput],
          [{ content: zoneDescription?.trim() ? `Zone Description: ${zoneDescription}` : "Zone Description: —", colSpan: 10, styles: { halign: "left", fontStyle: "normal", fillColor: [243, 244, 246] } } as CellInput],
          [
            { content: "Task", styles: { fillColor: [249, 250, 251] } },
            { content: "Function", styles: { fillColor: [249, 250, 251] } },
            { content: "Realization", styles: { fillColor: [249, 250, 251] } },
            { content: "Property", styles: { fillColor: [249, 250, 251] } },
            { content: "Guide Word", styles: { fillColor: [249, 250, 251] } },
            { content: "Deviations", styles: { fillColor: [249, 250, 251] } },
            { content: "Causes", styles: { fillColor: [249, 250, 251] } },
            { content: "Consequences", styles: { fillColor: [249, 250, 251] } },
            { content: "Requirements", styles: { fillColor: [249, 250, 251] } },
            { content: "ISO", styles: { fillColor: [249, 250, 251] } },
          ],
        ];

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Function-Centric Hazard Identification", pageW / 2, 24, { align: "center" });

        autoTable(doc, {
          theme: "grid",
          startY: 30,
          head: headRows,
          body: rows,
          styles: { font: "helvetica", fontSize: 9, cellPadding: 2, valign: "top", overflow: "linebreak" },
          headStyles: { fillColor: [243, 244, 246], textColor: 20, fontStyle: "bold" },
          columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 22 }, 2: { cellWidth: 22 }, 3: { cellWidth: 26 }, 4: { cellWidth: 18 }, 5: { cellWidth: 32 }, 6: { cellWidth: 32 }, 7: { cellWidth: 32 }, 8: { cellWidth: 40 }, 9: { cellWidth: 30 } },
          margin: { left: 10, right: 10 },
          tableLineColor: 200,
          tableLineWidth: 0.1,
          didDrawPage: () => { drawHeader(z.label || z.id); drawFooter(); },
        });

        // DSM (same as your working layout)...
        // build pairs -> fnOrder/reqOrder/hit, then render DSM autoTable centered
        const buildDSMMatrixFromIR = (irData: IR) => {
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

        const { fnOrder, reqOrder, hit } = buildDSMMatrixFromIR(ir);

        const prevTable = (doc as any).lastAutoTable;
        const firstPageNoBeforeDSM = doc.internal.getNumberOfPages();

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        const dsmTitle = "Function–Requirement DSM";
        const dsmTitleY = Math.max(24, ((prevTable?.finalY as number) ?? 24) + 10);
        doc.text(dsmTitle, pageW / 2, dsmTitleY, { align: "center" });
        const startYDSM = dsmTitleY + 6;

        const dsmHead: (string | CellInput)[][] = [
          ["Function \\\\ Requirement", ...reqOrder.map(r => (r.text || `[${r.id}]`))]
        ];
        const dsmBody: RowInput[] = fnOrder.map(fn => {
          const row: (string | CellInput)[] = [];
          row.push(fn.name || "(unnamed function)");
          if (reqOrder.length === 0) {
            row.push("(No requirements)");
          } else {
            for (const req of reqOrder) row.push(hit.has(`${fn.id}|${req.id}`) ? "X" : "");
          }
          return row as RowInput;
        });

        // column widths & centered block identical to your working code
        const firstColWidth = 60;
        const minOtherCol = 12;
        const maxOtherCol = 28;
        const computedOther = Math.floor((pageW - 20 - firstColWidth) / Math.max(1, reqOrder.length));
        const otherColWidth = Math.min(maxOtherCol, Math.max(minOtherCol, computedOther));
        const dsmColumnStyles: Record<number, any> = { 0: { cellWidth: firstColWidth } };
        for (let i = 1; i <= reqOrder.length; i++) {
          dsmColumnStyles[i] = { cellWidth: otherColWidth, halign: "center", valign: "middle" };
        }

        autoTable(doc, {
          theme: "grid",
          startY: startYDSM,
          head: dsmHead,
          body: dsmBody,
          styles: { font: "helvetica", fontSize: 9, cellPadding: 2, overflow: "linebreak", valign: "top" },
          headStyles: { fillColor: [243, 244, 246], textColor: 20, fontStyle: "bold" },
          columnStyles: dsmColumnStyles,
          margin: {
            left: (pageW - (firstColWidth + reqOrder.length * otherColWidth)) / 2,
            right: 10,
          },
          didDrawPage: () => {
            const current = doc.internal.getCurrentPageInfo().pageNumber;
            if (current > firstPageNoBeforeDSM) {
              doc.setFont("helvetica", "bold");
              doc.setFontSize(12);
              doc.text("Function–Requirement DSM", pageW / 2, 24, { align: "center" });
            }
            // Footer on every page
            const total = doc.getNumberOfPages();
            doc.setDrawColor(220);
            doc.line(10, pageH - 12, pageW - 10, pageH - 12);
            doc.setDrawColor(0);
            doc.setFontSize(10);
            doc.text(`Page ${current} / ${total}`, pageW - 10, pageH - 6, { align: "right" });
          },

        });
        setExportPct(Math.round(((i + 1) / total) * 100));
        setExportStep(`Done "${zoneLabel}"`);
        await flush();
      }

      // go back to where user was
      navigate(returnTo, { replace: true });

      setExportStep("Finalizing PDF…");
      await flush();
      const safe = (s: string) => (s || "").replace(/[^\w-]+/g, "_");
      const ts = new Date().toLocaleString().replace(/[^\dA-Za-z]+/g, "-");
      doc.save(`${safe(projectName || "Project")}_ALL_ZONES_${ts}.pdf`);
      // finally save the PDF

      // doc.save(name);
      setExportStep("Complete");
      setExportPct(100);
    } catch (err: any) {
      console.error("Export all zones failed:", err);
      toast.error(err?.message || "Exporting all zones failed");
    } finally {
      setTimeout(() => setExporting(false), 600);
    }
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
  const handleExportAllFTAsOnTheFly = async () => {
    const { zones, projectName } = useZoneStore.getState();
    const zoneLabelOf = (zid: string) => zones.find((z) => z.id === zid)?.label || zid;

    const items = readAllFtasFromLocalStorage();
    if (!items.length) {
      toast.error("No FTA graphs found.");
      return;
    }
    console.log("Exporting all FTAs:", items);
    setExportingFta(true);
    setExportPctFta(0);
    setExportStepFta("Preparing…");
    await flush();

    const returnTo = location.pathname;
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const marginX = 10;

      const drawHeader = (zoneLabel: string, taskId: string) => {
        const t = `Project: ${projectName || "Untitled Project"}    •    Zone: ${zoneLabel}    •    Task: ${taskId}`;
        const dateStr = new Date().toLocaleString();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(t, marginX, 12);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(120);
        doc.text(dateStr, pageW - marginX, 12, { align: "right" });
        doc.setTextColor(0);
        doc.setDrawColor(220);
        doc.line(marginX, 20, pageW - marginX, 20);
      };
      const drawFooter = () => {
        const current = doc.internal.getCurrentPageInfo().pageNumber;
        const total = doc.getNumberOfPages();
        doc.setDrawColor(220);
        doc.line(10, pageH - 12, pageW - 10, pageH - 12);
        doc.setDrawColor(0);
        doc.setFontSize(10);
        doc.text(`Page ${current} / ${total}`, pageW - 10, pageH - 6, { align: "right" });
      };

      let first = true;
      const total = items.length;

      for (let i = 0; i < total; i++) {
        const { zoneId, taskId } = items[i];
        const zoneLabel = zoneLabelOf(zoneId);
        setExportStepFta(`Loading FTA "${zoneLabel}" / task "${taskId}"…`);
        setExportPctFta(Math.round((i / total) * 100));
        await flush();

        // Make FTA active + navigate to /fta. If your app uses a dedicated
        // “selectedFta” in ZoneStore, set it here:
        useZoneStore.setState({ selectedId: zoneId, selectedFta: { zoneId, taskId } });
        navigate("/fta", {
          replace: true,
          state: { captureForExport: true, forZoneId: zoneId, forTaskId: taskId, returnTo },
        });

        // Wait for FTACanvas to be ready for this FTA
        const key = `${zoneId}::${taskId}`;
        try {
          await once("fta:ready", (e) => e?.detail?.key === key, 20000);
        } catch {
          // fallback settle
          await new Promise((r) => setTimeout(r, 1200));
        }

        setExportStepFta(`Capturing FTA "${zoneLabel}" / task "${taskId}"…`);
        await flush();

        // Defensive check before capture
        if (!window.FlowCapture || typeof window.FlowCapture.capture !== "function") {
          throw new Error("FTA capture is not ready on this page");
        }
        // Capture via in-page FlowCapture
        const dataUrl = await window.FlowCapture!.capture({
          width: 1920,
          height: 1080,
          pixelRatio: Math.min(3, window.devicePixelRatio || 1),
          bg: "#ffffff",
        });

        if (!first) doc.addPage("a4", "landscape");
        first = false;

        drawHeader(zoneLabel, taskId);
        // fit image under header
        const topY = 24;
        const footerGap = 10;
        const maxW = pageW - marginX * 2;
        const maxH = pageH - topY - footerGap;
        const aspect = 1920 / 1080;
        let drawW = maxH * aspect;
        let drawH = maxH;
        if (drawW > maxW) {
          drawW = maxW;
          drawH = drawW / aspect;
        }
        const imgX = marginX + (maxW - drawW) / 2;
        doc.addImage(dataUrl, "PNG", imgX, topY, drawW, drawH);
        drawFooter();

        setExportPctFta(Math.round(((i + 1) / total) * 100));
        setExportStepFta(`Added "${zoneLabel}" / task "${taskId}"`);
        await flush();
      }

      // Return user
      navigate(returnTo, { replace: true });

      setExportStepFta("Finalizing PDF…");
      await flush();
      const safe = (s: string) => (s || "").replace(/[^\w-]+/g, "_");
      const ts = new Date().toLocaleString().replace(/[^\dA-Za-z]+/g, "-");
      doc.save(`${safe(projectName || "Project")}_ALL_FTAs_${ts}.pdf`);

      setExportStepFta("Complete");
      setExportPctFta(100);
    } catch (err: any) {
      console.error("Export all FTAs failed:", err);
      toast.error(err?.message || "Exporting all FTAs failed");
    } finally {
      setTimeout(() => setExportingFta(false), 600);
    }
  }
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
          {/* <HeaderExportActions /> */}
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>File</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="min-w-[220px] p-2 mt-2">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                      onClick={handleExportAllFTAsOnTheFly}
                    >
                      Export PDF (All FTAs)
                    </button>
                    {/* New Project */}
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                      onClick={() => setNewProjectOpen(true)}
                    >
                      New Project…
                    </button>
                    <button type="button"
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                      onClick={handleExportAllZonesOnTheFly}>
                      Export PDF (All Zones, on the fly)
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
      <AlertDialog open={exporting} onOpenChange={(o) => o || setExporting(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exporting…</AlertDialogTitle>
          </AlertDialogHeader>

          <div className="space-y-3">
            <Progress value={exportPct} />
            <p className="text-sm text-muted-foreground">{exportStep || "Starting…"}</p>
          </div>

          {/* No footer buttons; it’s purely informational */}
        </AlertDialogContent>
      </AlertDialog>
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