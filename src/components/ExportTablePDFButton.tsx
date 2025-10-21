import React from "react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable,  { type CellInput, type RowInput } from "jspdf-autotable";
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

  const handleExport = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
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
        0: { cellWidth: 24 },  // Task
        1: { cellWidth: 24 },  // Function
        2: { cellWidth: 24 },  // Realization
        3: { cellWidth: 28 },  // Property
        4: { cellWidth: 20 },  // Guide Word
        5: { cellWidth: 34 },  // Deviations
        6: { cellWidth: 34 },  // Causes
        7: { cellWidth: 34 },  // Consequences
        8: { cellWidth: 42 },  // Requirements
        9: { cellWidth: 24 },  // ISO
      },
      margin: { left: 10, right: 10 },
      didDrawPage: () => {
        header();
        const pageNumber = doc.internal.getNumberOfPages();
        footer(pageNumber, doc.getNumberOfPages());
      },
    });

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