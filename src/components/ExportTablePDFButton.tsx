import React from "react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable, { type CellInput, type RowInput } from "jspdf-autotable";
import type { FormValues } from "@/common/types";
import Tooltip from "@mui/material/Tooltip";
import Fab from "@mui/material/Fab";
import { FileDown } from "lucide-react";
import { grey } from '@mui/material/colors';
const buttonColor = grey[500];
/**
 * Exports a text-based PDF that mirrors the browser table:
 * - Task / Function / Realization / Property cells use rowSpan
 * - No inputs/buttons; pure content
 */
type Props = {
  data: FormValues;       // your deriveRowSpans(...) output (it includes rowSpan on each level)
  projectName?: string;
  zoneLabel?: string;
  zoneDescription?: string;
  fileName?: string;
};

const ExportStructuredPDFButton: React.FC<Props> = ({
  data,
  projectName = "Project",
  zoneLabel = "Zone",
  zoneDescription,
  fileName,
}) => {
  const buildRowsWithRowSpan = (): RowInput[] => {
    const rows: RowInput[] = [];

    for (const task of data.tasks ?? []) {
      const taskName = task.taskName ?? "";
      const taskRowSpan = Math.max(1, task.rowSpan ?? 1);
      const functions = task.functions ?? [];

      if (!functions.length) {
        // No functions: fully-specified row (no spans)
        rows.push([
          { content: taskName, rowSpan: 1 } as CellInput,
          "(No function)",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]);
        continue;
      }

      let taskPrinted = false;

      for (const fn of functions) {
        const fnName = fn.functionName ?? "";
        const fnRowSpan = Math.max(1, fn.rowSpan ?? 1);
        const realizations = fn.realizations ?? [];

        if (!realizations.length) {
          // One warning row: only include cells that are NOT covered by a span
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
          continue;
        }

        let fnPrinted = false;

        for (const real of realizations) {
          const realName = real.realizationName ?? "";
          const realRowSpan = Math.max(1, real.rowSpan ?? 1);
          const properties = real.properties ?? [];

          if (!properties.length) {
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
            taskPrinted = true;
            fnPrinted = true;
            continue;
          }

          let realPrinted = false;

          for (const prop of properties) {
            const propText = (prop.properties ?? []).filter(Boolean).join("\n");
            const propRowSpan = Math.max(1, prop.rowSpan ?? 1);
            const interpretations = prop.interpretations ?? [];

            if (!interpretations.length) {
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
              taskPrinted = true;
              fnPrinted = true;
              realPrinted = true;
              continue;
            }

            let propPrinted = false;

            for (const inter of interpretations) {
              const guide = inter.guideWord ?? "";

              const deviations = (inter.deviations ?? [])
                .map((d, i) => (d?.text ? `${i + 1}. ${d.text}` : ""))
                .filter(Boolean)
                .join("\n");

              const causes = (inter.causes ?? [])
                .map((c, i) => (c?.text ? `${i + 1}. ${c.text}` : ""))
                .filter(Boolean)
                .join("\n");

              const consequences = (inter.consequences ?? [])
                .map((c, i) => (c?.text ? `${i + 1}. ${c.text}` : ""))
                .filter(Boolean)
                .join("\n");

              const requirements = (inter.requirements ?? [])
                .map((r, i) => (r?.text ? `${i + 1}. ${r.text}` : ""))
                .filter(Boolean)
                .join("\n");

              const iso = (inter.isoMatches ?? [])
                .map((i) => i.iso_number || i.title || "")
                .filter(Boolean)
                .join(", ");

              // Build row: only include non-spanned columns
              const row: RowInput = [];
              if (!taskPrinted) row.push({ content: taskName, rowSpan: taskRowSpan } as CellInput);
              if (!fnPrinted) row.push({ content: fnName, rowSpan: fnRowSpan } as CellInput);
              if (!realPrinted) row.push({ content: realName, rowSpan: realRowSpan } as CellInput);
              if (!propPrinted) row.push({ content: propText, rowSpan: propRowSpan } as CellInput);
              row.push(guide);
              row.push(deviations || "");
              row.push(causes || "");
              row.push(consequences || "");
              row.push(requirements || "");
              row.push(iso || "");

              rows.push(row);

              // after first line in each group, mark those columns as already printed (spanned)
              taskPrinted = true;
              fnPrinted = true;
              realPrinted = true;
              propPrinted = true;
            }
          }
        }
      }
    }

    if (rows.length === 0) {
      rows.push(["(No tasks)", "", "", "", "", "", "", "", "", ""]);
    }

    return rows;
  };
  // ---- DSM helpers (build a Function × Requirement matrix) ----
  type DSMCellHit = Set<string>; // `${fnId}|${reqId}`

  function collectFunctionRequirementPairsFromForm(data: FormValues) {
    const pairs: {
      taskId: string;
      taskName?: string;
      functionId: string;
      functionName?: string;
      requirementId: string;
      requirementText?: string;
    }[] = [];

    for (const task of data.tasks ?? []) {
      for (const fn of task.functions ?? []) {
        const seen = new Set<string>();
        for (const real of fn.realizations ?? []) {
          for (const prop of real.properties ?? []) {
            for (const inter of prop.interpretations ?? []) {
              for (const req of inter.requirements ?? []) {
                if (!req?.id) continue;
                const key = `${fn.id}|${req.id}`;
                if (seen.has(key)) continue;
                seen.add(key);
                pairs.push({
                  taskId: task.id,
                  taskName: task.taskName,
                  functionId: fn.id,
                  functionName: fn.functionName,
                  requirementId: req.id,
                  requirementText: req.text,
                });
              }
            }
          }
        }
      }
    }
    return pairs;
  }

  function buildDSMMatrixFromForm(data: FormValues) {
    const pairs = collectFunctionRequirementPairsFromForm(data);

    const fnOrder: { id: string; name: string }[] = [];
    const reqOrder: { id: string; text: string }[] = [];
    const fnSeen = new Set<string>();
    const reqSeen = new Set<string>();

    for (const p of pairs) {
      if (p.functionId && !fnSeen.has(p.functionId)) {
        fnSeen.add(p.functionId);
        fnOrder.push({ id: p.functionId, name: p.functionName ?? "" });
      }
      if (p.requirementId && !reqSeen.has(p.requirementId)) {
        reqSeen.add(p.requirementId);
        reqOrder.push({ id: p.requirementId, text: p.requirementText ?? "" });
      }
    }

    // if there are no requirements, still list all functions found in tasks
    if (reqOrder.length === 0) {
      for (const task of data.tasks ?? []) {
        for (const fn of task.functions ?? []) {
          if (fn.id && !fnSeen.has(fn.id)) {
            fnSeen.add(fn.id);
            fnOrder.push({ id: fn.id, name: fn.functionName ?? "" });
          }
        }
      }
    }

    const hit: DSMCellHit = new Set();
    for (const p of pairs) {
      if (p.functionId && p.requirementId) {
        hit.add(`${p.functionId}|${p.requirementId}`);
      }
    }

    return { fnOrder, reqOrder, hit };
  }

  const handleExport = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // header/footer
    const title = `Project: ${projectName}    •    Zone: ${zoneLabel}`;
    const dateStr = new Date().toLocaleString();

    const header = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(title, 10, 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(dateStr, pageWidth - 10, 12, { align: "right" });
      doc.setTextColor(0);
      doc.setDrawColor(220);
      doc.line(10, 20, pageWidth - 10, 20);
      doc.setDrawColor(0);
    };

    const footer = (page: number, total: number) => {
      doc.setDrawColor(220);
      doc.line(10, pageHeight - 12, pageWidth - 10, pageHeight - 12);
      doc.setDrawColor(0);
      doc.setFontSize(10);
      doc.text(`Page ${page} / ${total}`, pageWidth - 10, pageHeight - 6, { align: "right" });
    };

    const rows = buildRowsWithRowSpan();

    // Build PDF table head with zone label + description rows
    const headRows: (string | CellInput)[][] = [
      [
        {
          content: `Hazard Zone: ${zoneLabel || "Unnamed Zone"}`,
          colSpan: 10,
          styles: {
            halign: "center",
            fontStyle: "bold",
            fillColor: [229, 231, 235], // gray-200
          },
        } as CellInput,
      ],
      [
        {
          content:
            zoneDescription && zoneDescription.trim().length > 0
              ? `Zone Description: ${zoneDescription}`
              : "Zone Description: —",
          colSpan: 10,
          styles: {
            halign: "left",
            fontStyle: "normal",
            fillColor: [243, 244, 246], // gray-100
          },
        } as CellInput,
      ],
      [
        {
          content: "Task",
          styles: { fillColor: [249, 250, 251] }, // gray-50
        },
        {
          content: "Function",
          styles: { fillColor: [249, 250, 251] },
        },
        {
          content: "Realization",
          styles: { fillColor: [249, 250, 251] },
        },
        {
          content: "Property",
          styles: { fillColor: [249, 250, 251] },
        },
        {
          content: "Guide Word",
          styles: { fillColor: [249, 250, 251] },
        },
        {
          content: "Deviations",
          styles: { fillColor: [249, 250, 251] },
        },
        {
          content: "Causes",
          styles: { fillColor: [249, 250, 251] },
        },
        {
          content: "Consequences",
          styles: { fillColor: [249, 250, 251] },
        },
        {
          content: "Requirements",
          styles: { fillColor: [249, 250, 251] },
        },
        {
          content: "ISO",
          styles: { fillColor: [249, 250, 251] },
        },
      ],
    ];

    // --- Section title for the first table (outside the table) ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const fchiTitle = "Function-Centric Hazard Identification";
    const fchiTitleY = 24;
    doc.text(fchiTitle, pageWidth / 2, fchiTitleY, { align: "center" });
    const firstTableStartY = fchiTitleY + 6;
    // ---- Fit FCHI table to content width and keep proportions ----
    const contentMargin = { left: 10, right: 10 };
    const contentWidth = pageWidth - contentMargin.left - contentMargin.right;

    // Intended column widths (mm)
    const fchiCols = [22, 22, 22, 26, 18, 32, 32, 32, 40, 30];
    const fchiSum = fchiCols.reduce((a, b) => a + b, 0);

    // Scale down if needed to fit content width
    const fchiScale = Math.min(1, contentWidth / fchiSum);
    const fchiColumnStyles = Object.fromEntries(
      fchiCols.map((w, i) => [i, { cellWidth: Math.floor(w * fchiScale) }])
    );

    autoTable(doc, {
      theme: "grid",
      startY: firstTableStartY,
      head: headRows,
      body: rows,
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 2,
        valign: "top",
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: 20,
        fontStyle: "bold",
      },
      // width tuning to mirror your Tailwind widths
      columnStyles: fchiColumnStyles,
      margin: contentMargin,
      tableLineColor: 200,
      tableLineWidth: 0.1,
      horizontalPageBreak: false,
      didDrawPage: () => {
        header();
        const pageNumber = doc.internal.getNumberOfPages();
        footer(pageNumber, doc.getNumberOfPages());
      },
    });
    // ---------- DSM PAGE ----------
    const { fnOrder, reqOrder, hit } = buildDSMMatrixFromForm(data);

    // Only create DSM table if there is something to show
    if (fnOrder.length > 0) {
      // Try to continue on the same page if there is vertical space
      const prevTable = (doc as any).lastAutoTable;
      const firstPageNoBeforeDSM = doc.internal.getNumberOfPages();

      // --- Section title for DSM (outside the table) ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      const dsmTitle = "Function–Requirement DSM";
      const dsmTitleY = Math.max(24, ((prevTable?.finalY as number) ?? 24) + 10);
      doc.text(dsmTitle, pageWidth / 2, dsmTitleY, { align: "center" });
      const startYDSM = dsmTitleY + 6;

      // Build head rows: header row only (no DSM title row)
      const dsmHead: (string | CellInput)[][] = [
        ["Function \\\\ Requirement", ...reqOrder.map(r => (r.text || `[${r.id}]`))]
      ];

      // Build body rows
      const dsmBody: RowInput[] = fnOrder.map(fn => {
        const row: (string | CellInput)[] = [];
        row.push(fn.name || "(unnamed function)");
        if (reqOrder.length === 0) {
          row.push("(No requirements)");
        } else {
          for (const req of reqOrder) {
            row.push(hit.has(`${fn.id}|${req.id}`) ? "X" : "");
          }
        }
        return row as RowInput;
      });

      // ---- DSM sizing that always fits the page and centers the table ----
      const dsmContentWidth = contentWidth; // reuse the same content width
      const firstColWidth = 60; // mm for the Function column
      const minOtherCol = 12;
      const maxOtherCol = 28;

      const remaining = Math.max(0, dsmContentWidth - firstColWidth);
      const safePerCol = reqOrder.length > 0 ? Math.floor(remaining / reqOrder.length) : remaining;
      const otherColWidth = Math.min(maxOtherCol, Math.max(minOtherCol, safePerCol));

      const dsmColumnStyles: Record<number, any> = { 0: { cellWidth: firstColWidth } };
      for (let i = 1; i <= reqOrder.length; i++) {
        dsmColumnStyles[i] = { cellWidth: otherColWidth, halign: "center", valign: "middle" };
      }

      const dsmTableWidth = firstColWidth + otherColWidth * Math.max(1, reqOrder.length);
      const side = Math.max(0, (pageWidth - dsmTableWidth) / 2);
      const dsmMargin = { left: side, right: side };

      autoTable(doc, {
        theme: "grid",
        startY: startYDSM, // try rendering just below the previous table
        head: dsmHead,
        body: dsmBody,
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 2,
          overflow: "linebreak",
          valign: "top",
        },
        headStyles: {
          fillColor: [243, 244, 246],
          textColor: 20,
          fontStyle: "bold",
        },
        columnStyles: dsmColumnStyles,
        margin: dsmMargin,
        didDrawPage: () => {
          const current = doc.internal.getCurrentPageInfo().pageNumber;

          // When DSM continues on a NEW page, draw the DSM title at the top of that page.
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
    }

    const safe = (s: string) => (s || "").replace(/[^\w-]+/g, "_");
    const ts = new Date().toLocaleString().replace(/[^\dA-Za-z]+/g, "-");
    const name = fileName || `${safe(projectName)}_${safe(zoneLabel)}_${ts}.pdf`;
    doc.save(name);
  };

  return (
    <Tooltip title="Download as PDF">
      <Fab
        size="small"
        color={buttonColor}
        onClick={handleExport}
        sx={{
          position: "fixed",
          right: 18,
          top: "15vh", // 150px from top
        }}

      >
        <FileDown />
      </Fab>
    </Tooltip>
  );
};

export default ExportStructuredPDFButton;