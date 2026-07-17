"use client";

import { Button } from "@/components/ui/button";
import { downloadXlsx, rowsFromRecords } from "@/lib/export-xlsx";
import { Download } from "lucide-react";

type CellValue = string | number | boolean | null | undefined;

export function ExportXlsxButton({
  filename,
  rows,
  columns,
  label = "Export .xlsx",
  disabled,
}: {
  filename: string;
  /** Flat records — keys become column headers unless `columns` is set */
  rows: Record<string, CellValue>[];
  columns?: string[];
  label?: string;
  disabled?: boolean;
}) {
  function handleExport() {
    downloadXlsx(filename, rowsFromRecords(rows, columns));
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || rows.length === 0}
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}

/** Toolbar that places the export control in the top-right of a table section */
export function TableExportBar({
  filename,
  rows,
  columns,
}: {
  filename: string;
  rows: Record<string, CellValue>[];
  columns?: string[];
}) {
  return (
    <div className="mb-2 flex justify-end">
      <ExportXlsxButton filename={filename} rows={rows} columns={columns} />
    </div>
  );
}
