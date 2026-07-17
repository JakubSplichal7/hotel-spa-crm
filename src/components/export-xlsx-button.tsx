"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  downloadTableExport,
  rowsFromRecords,
  type ExportFormat,
} from "@/lib/export-xlsx";
import { ChevronDown, Download, FileSpreadsheet, FileText, FileType2 } from "lucide-react";

type CellValue = string | number | boolean | null | undefined;

const FORMATS: {
  format: ExportFormat;
  label: string;
  description: string;
  icon: ReactNode;
}[] = [
  {
    format: "xlsx",
    label: "Excel (.xlsx)",
    description: "Spreadsheet for Excel / Sheets",
    icon: <FileSpreadsheet className="h-4 w-4" />,
  },
  {
    format: "pdf",
    label: "PDF (.pdf)",
    description: "Printable document",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    format: "xml",
    label: "XML (.xml)",
    description: "Structured data file",
    icon: <FileType2 className="h-4 w-4" />,
  },
];

export function ExportMenuButton({
  filename,
  rows,
  columns,
  title,
  disabled,
}: {
  filename: string;
  rows: Record<string, CellValue>[];
  columns?: string[];
  /** Optional PDF title (defaults to filename) */
  title?: string;
  disabled?: boolean;
}) {
  const empty = disabled || rows.length === 0;

  function handleExport(format: ExportFormat) {
    downloadTableExport(
      format,
      filename,
      rowsFromRecords(rows, columns),
      title
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={empty}>
          <Download className="h-4 w-4" />
          Export
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {FORMATS.map((item) => (
          <DropdownMenuItem
            key={item.format}
            onSelect={() => handleExport(item.format)}
            className="gap-2"
          >
            {item.icon}
            <span className="flex flex-col">
              <span>{item.label}</span>
              <span className="text-xs text-muted-foreground">
                {item.description}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Toolbar that places the export control in the top-right of a table section */
export function TableExportBar({
  filename,
  rows,
  columns,
  title,
}: {
  filename: string;
  rows: Record<string, CellValue>[];
  columns?: string[];
  title?: string;
}) {
  return (
    <div className="mb-2 flex justify-end">
      <ExportMenuButton
        filename={filename}
        rows={rows}
        columns={columns}
        title={title}
      />
    </div>
  );
}

/** @deprecated Use ExportMenuButton */
export const ExportXlsxButton = ExportMenuButton;
