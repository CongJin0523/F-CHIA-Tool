import React from "react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable, { type CellInput, type RowInput } from "jspdf-autotable";
import type { FormValues } from "@/common/types";

/**
 * Exports a text-based PDF that mirrors the browser table:
 * - Task / Function / Realization / Property cells use rowSpan
 * - No inputs/buttons; pure content
 */
type Props = {
  data: FormValues;       // your deriveRowSpans(...) output (it includes rowSpan on each level)
  projectName?: string;
  zoneLabel?: string;
  fileName?: string;
};

const ExportStructuredPDFButton: React.FC<Props> = ({
  data,
  projectName = "Project",
  zoneLabel = "Zone",
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
    const title = "Function-Centric Hazard Identification";
    const sub = `Project: ${projectName}    •    Zone: ${zoneLabel}`;
    const dateStr = new Date().toLocaleString();

    const header = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(title, 10, 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(sub, 10, 18);
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

    autoTable(doc, {
      theme: "grid",
      startY: 24,
      head: [[
        "Task",
        "Function",
        "Realization",
        "Property",
        "Guide Word",
        "Deviations",
        "Causes",
        "Consequences",
        "Requirements",
        "ISO",
      ]],
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
      columnStyles: {
        0: { cellWidth: 22 },  // Task
        1: { cellWidth: 22 },  // Function
        2: { cellWidth: 22 },  // Realization
        3: { cellWidth: 26 },  // Property
        4: { cellWidth: 18 },  // Guide Word
        5: { cellWidth: 32 },  // Deviations
        6: { cellWidth: 32 },  // Causes
        7: { cellWidth: 32 },  // Consequences
        8: { cellWidth: 40 },  // Requirements
        9: { cellWidth: 26 },  // ISO
      },
      margin: { left: 10, right: 10 },
      didDrawPage: () => {
        header();
        const pageNumber = doc.internal.getNumberOfPages();
        footer(pageNumber, doc.getNumberOfPages());
      },
    });
    // ---------- DSM PAGE ----------
    const { fnOrder, reqOrder, hit } = buildDSMMatrixFromForm(data);

    // Only create DSM page if there is something to show
    if (fnOrder.length > 0) {
      doc.addPage();
      // Header for DSM
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Function–Requirement DSM", 10, 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Project: ${projectName}    •    Zone: ${zoneLabel}`, 10, 18);
      doc.setDrawColor(220);
      doc.line(10, 20, pageWidth - 10, 20);
      doc.setDrawColor(0);

      // Build head row: first column is the function label
      const dsmHead: string[][] = [
        ["Function \\ Requirement", ...reqOrder.map(r => (r.text || `[${r.id}]`))]
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

      // Calculate simple column widths: first col wider, others compact
      // A4 usable width ≈ 190mm with 10mm margins; we keep it conservative.
      const firstColWidth = 60; // mm
      const otherColWidth = Math.max(16, Math.floor((pageWidth - 20 - firstColWidth) / Math.max(1, reqOrder.length)));

      const dsmColumnStyles: Record<number, any> = { 0: { cellWidth: firstColWidth } };
      for (let i = 1; i <= reqOrder.length; i++) {
        dsmColumnStyles[i] = { cellWidth: otherColWidth, halign: "center", valign: "middle" };
      }

      autoTable(doc, {
        theme: "grid",
        startY: 24,
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
        margin: { left: 10, right: 10 },
        didDrawPage: () => {
          // footer similar to first page
          const pageNo = doc.internal.getCurrentPageInfo().pageNumber;
          const total = doc.getNumberOfPages();
          doc.setDrawColor(220);
          doc.line(10, pageHeight - 12, pageWidth - 10, pageHeight - 12);
          doc.setDrawColor(0);
          doc.setFontSize(10);
          doc.text(`Page ${pageNo} / ${total}`, pageWidth - 10, pageHeight - 6, { align: "right" });
        },
      });
    }

    const safe = (s: string) => (s || "").replace(/[^\w\-]+/g, "_");
    const ts = new Date().toLocaleString().replace(/[^\dA-Za-z]+/g, "-");
    const name = fileName || `${safe(projectName)}_${safe(zoneLabel)}_${ts}.pdf`;
    doc.save(name);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      Export (Structured PDF)
    </Button>
  );
};

export default ExportStructuredPDFButton;