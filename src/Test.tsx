import React from "react";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";

const ExportPDFButton: React.FC = () => {
  const handleExport = () => {
    // Create a new jsPDF document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Add text to the PDF
    doc.text("Hello world!", 10, 10);

    // Save the generated PDF
    doc.save("a4.pdf");
  };

  return (
    <Button onClick={handleExport}>
      Export to PDF
    </Button>
  );
};

export default ExportPDFButton;