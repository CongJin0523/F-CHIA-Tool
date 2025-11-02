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

      // ① Task 没有 functions
      if (!functions.length) {
        rows.push([
          { content: taskName, rowSpan: 1 } as CellInput,
          { content: "No function found, please complete in the graph editor.", colSpan: 9 } as CellInput,
        ]);
        continue;
      }

      let taskPrinted = false;

      for (const fn of functions) {
        const fnName = fn.functionName ?? "";
        const fnRowSpan = Math.max(1, fn.rowSpan ?? 1);
        const realizations = fn.realizations ?? [];

        // ② Function 没有 realizations
        if (!realizations.length) {
          const row: RowInput = [];
          if (!taskPrinted) row.push({ content: taskName, rowSpan: taskRowSpan } as CellInput);
          row.push({ content: fnName, rowSpan: 1 } as CellInput);
          row.push({ content: "No realization found, please complete in the graph editor.", colSpan: 8 } as CellInput);
          rows.push(row);
          taskPrinted = true;
          continue;
        }

        let fnPrinted = false;

        for (const real of realizations) {
          const realName = real.realizationName ?? "";
          const realRowSpan = Math.max(1, real.rowSpan ?? 1);
          const properties = real.properties ?? [];

          // ③ Realization 没有 properties
          if (!properties.length) {
            const row: RowInput = [];
            if (!taskPrinted) row.push({ content: taskName, rowSpan: taskRowSpan } as CellInput);
            if (!fnPrinted) row.push({ content: fnName, rowSpan: fnRowSpan } as CellInput);
            row.push({ content: realName, rowSpan: 1 } as CellInput);
            row.push({ content: "No property found, please complete in the graph editor.", colSpan: 7 } as CellInput);
            rows.push(row);
            taskPrinted = true;
            fnPrinted = true;
            continue;
          }

          let realPrinted = false;

          for (const prop of properties) {
            const propRowSpan = Math.max(1, prop.rowSpan ?? 1);
            const propList = (prop.properties ?? []).filter(Boolean);
            const propText = propList.length
              ? propList.map((p, i) => `${i + 1}. ${p}`).join("\n")
              : "(No property text)";

            const interpretations = prop.interpretations ?? [];

            // ④ Property 没有 interpretations
            if (!interpretations.length) {
              const row: RowInput = [];
              if (!taskPrinted) row.push({ content: taskName, rowSpan: taskRowSpan } as CellInput);
              if (!fnPrinted) row.push({ content: fnName, rowSpan: fnRowSpan } as CellInput);
              if (!realPrinted) row.push({ content: realName, rowSpan: realRowSpan } as CellInput);
              row.push({ content: propText, rowSpan: 1 } as CellInput);
              row.push({ content: "No interpretation found, please complete in the graph editor.", colSpan: 6 } as CellInput);
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
    const doc = new jsPDF({ unit: "mm", format: "a3", orientation: "landscape" });
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

    // Only the header titles row in the headRows
    const headRows: (string | CellInput)[][] = [
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
        { content: "ISO Standard", styles: { fillColor: [249, 250, 251] } },
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

    // Intro block (outside the main table) to avoid unbreakable header rows
    const introRows: (string | CellInput)[][] = [
      [
        {
          content: `Hazard Zone: ${zoneLabel || 'Unnamed Zone'}`,
          styles: { fontStyle: 'bold' },
        } as CellInput,
      ],
      [
        {
          content: zoneDescription && zoneDescription.trim().length > 0 ? zoneDescription : '—',
        } as CellInput,
      ],
    ];

    autoTable(doc, {
      theme: 'plain',
      startY: firstTableStartY,
      body: introRows,
      margin: contentMargin,
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 2,
        overflow: 'linebreak',
        valign: 'top',
      },
      columnStyles: {
        0: { cellWidth: contentWidth },
      },
      // draw header/footer for this block as well
      didDrawPage: () => {
        header();
        const pageNumber = doc.internal.getNumberOfPages();
        footer(pageNumber, doc.getNumberOfPages());
      },
      // help break very long unspaced strings
      didParseCell: (data) => {
        const cell = data.cell;
        if (typeof cell.raw === 'string') {
          const fixed = cell.raw.replace(/(\S{40})/g, '$1\u200B');
          cell.text = fixed.split('\n');
        }
      },
      // allow body rows to flow onto next pages if needed
      rowPageBreak: 'auto',
      pageBreak: 'auto',
    });

    const afterIntroY = (doc as any).lastAutoTable ? ((doc as any).lastAutoTable.finalY as number) + 4 : firstTableStartY;

    // Dynamic widths: give Requirements ~1/3 of content width; others share the remaining 2/3 proportionally
    const baseline = [22, 22, 22, 26, 18, 32, 32, 32, 40, 30]; // original intention weights (mm)
    const reqIndex = 8; // column index of "Requirements"

    const desiredReqWidth = Math.floor(contentWidth / 3);
    const otherBaselineSum = baseline.reduce((sum, w, i) => (i === reqIndex ? sum : sum + w), 0);
    const remainingWidth = Math.max(0, contentWidth - desiredReqWidth);
    const scaleOther = otherBaselineSum > 0 ? (remainingWidth / otherBaselineSum) : 1;

    const fchiColumnStyles = Object.fromEntries(
      baseline.map((w, i) => {
        const width = i === reqIndex ? desiredReqWidth : Math.floor(w * scaleOther);
        return [i, { cellWidth: width }];
      })
    );

    autoTable(doc, {
      theme: "grid",
      startY: Math.max(firstTableStartY, afterIntroY),
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
      rowPageBreak: 'auto',
      pageBreak: 'auto',
      didParseCell: (data) => {
        const cell = data.cell;
        if (typeof cell.raw === 'string') {
          const fixed = cell.raw.replace(/(\S{40})/g, '$1\u200B');
          cell.text = fixed.split('\n');
        }
      },
    });
    // ---------- DSM PAGE ----------
    const { fnOrder, reqOrder, hit } = buildDSMMatrixFromForm(data);

    if (fnOrder.length > 0) {
      // Always start DSM on a new page
      doc.addPage();

      // Draw header + DSM title on the first DSM page now; didDrawPage will handle continued pages
      header();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      const dsmTitle = "Function–Requirement DSM";
      doc.text(dsmTitle, pageWidth / 2, 24, { align: "center" });
      const startYDSM = 30; // below the title

      // Build head rows (short keys to keep header small)
      const dsmHead: (string | CellInput)[][] = [
        ["Function \\ Requirement", ...reqOrder.map((_, i) => `R${i + 1}`)]
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
        startY: startYDSM,
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
          // Header and title on every DSM page
          header();
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text("Function–Requirement DSM", pageWidth / 2, 24, { align: "center" });

          // Footer on every page
          const current = doc.internal.getCurrentPageInfo().pageNumber;
          const total = doc.getNumberOfPages();
          doc.setDrawColor(220);
          doc.line(10, pageHeight - 12, pageWidth - 10, pageHeight - 12);
          doc.setDrawColor(0);
          doc.setFontSize(10);
          doc.text(`Page ${current} / ${total}`, pageWidth - 10, pageHeight - 6, { align: "right" });
        },
      });

      // --- Requirement Legend (maps R# -> full requirement text) ---
      const afterDSM = (doc as any).lastAutoTable ? ((doc as any).lastAutoTable.finalY as number) + 6 : startYDSM;
      if (reqOrder.length > 0) {
        const legendHead: (string | CellInput)[][] = [["Key", "Requirement Text"]];
        const legendBody: RowInput[] = reqOrder.map((r, i) => [
          `R${i + 1}`,
          (r.text && r.text.trim().length > 0) ? r.text : `[${r.id}]`
        ] as RowInput);

        autoTable(doc, {
          theme: 'grid',
          startY: afterDSM,
          head: legendHead,
          body: legendBody,
          styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 2,
            overflow: 'linebreak',
            valign: 'top',
          },
          headStyles: {
            fillColor: [243, 244, 246],
            textColor: 20,
            fontStyle: 'bold',
          },
          // two-column layout: small key column + wide text column
          margin: { left: 10, right: 10 },
          columnStyles: {
            0: { cellWidth: 18, halign: 'center' },
            1: { cellWidth: contentWidth - 18 },
          },
          didDrawPage: () => {
            // draw header/footer for legend pages too
            header();
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text("Function–Requirement DSM", pageWidth / 2, 24, { align: "center" });
            const current = doc.internal.getCurrentPageInfo().pageNumber;
            const total = doc.getNumberOfPages();
            doc.setDrawColor(220);
            doc.line(10, pageHeight - 12, pageWidth - 10, pageHeight - 12);
            doc.setDrawColor(0);
            doc.setFontSize(10);
            doc.text(`Page ${current} / ${total}`, pageWidth - 10, pageHeight - 6, { align: "right" });
          },
          // allow very long requirement text to break across pages
          rowPageBreak: 'auto',
          pageBreak: 'auto',
          didParseCell: (data) => {
            const cell = data.cell;
            if (typeof cell.raw === 'string') {
              const fixed = cell.raw.replace(/(\S{40})/g, '$1\u200B');
              cell.text = fixed.split('\n');
            }
          },
        });
      }
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