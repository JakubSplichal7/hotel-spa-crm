"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmYesNoDialog } from "@/components/deals/confirm-yes-no-dialog";
import { DeleteLinkedBookingsCheckbox } from "@/components/deals/delete-linked-bookings-checkbox";
import { ExportMenuButton } from "@/components/export-xlsx-button";
import { ChevronDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type BulkSelection = {
  selected: Set<string>;
  selectedIds: string[];
  selectedCount: number;
  allSelected: boolean;
  someSelected: boolean;
  toggle: (id: string) => void;
  toggleAll: () => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
};

export function useBulkSelection(rowIds: string[]): BulkSelection {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const idKey = rowIds.join("|");
  const stableIds = useMemo(
    () => (idKey ? idKey.split("|") : []),
    [idKey]
  );

  useEffect(() => {
    setSelected((prev) => {
      const allowed = new Set(stableIds);
      const next = new Set<string>();
      for (const id of prev) {
        if (allowed.has(id)) next.add(id);
      }
      return next;
    });
  }, [stableIds]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (stableIds.length === 0) return new Set();
      const allOn = stableIds.every((id) => prev.has(id));
      return allOn ? new Set() : new Set(stableIds);
    });
  }, [stableIds]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback(
    (id: string) => selected.has(id),
    [selected]
  );

  const selectedIds = useMemo(() => Array.from(selected), [selected]);
  const selectedCount = selectedIds.length;
  const allSelected =
    stableIds.length > 0 && stableIds.every((id) => selected.has(id));
  const someSelected = selectedCount > 0 && !allSelected;

  return {
    selected,
    selectedIds,
    selectedCount,
    allSelected,
    someSelected,
    toggle,
    toggleAll,
    clear,
    isSelected,
  };
}

export function BulkSelectAllCheckbox({
  selection,
  disabled,
}: {
  selection: BulkSelection;
  disabled?: boolean;
}) {
  return (
    <input
      type="checkbox"
      className="h-4 w-4 rounded border-input"
      checked={selection.allSelected}
      ref={(el) => {
        if (el) el.indeterminate = selection.someSelected;
      }}
      disabled={disabled}
      onChange={selection.toggleAll}
      aria-label={selection.allSelected ? "Unselect all" : "Select all"}
    />
  );
}

export function BulkRowCheckbox({
  id,
  selection,
}: {
  id: string;
  selection: BulkSelection;
}) {
  return (
    <input
      type="checkbox"
      className="h-4 w-4 rounded border-input"
      checked={selection.isSelected(id)}
      onChange={() => selection.toggle(id)}
      aria-label="Select row"
      onClick={(e) => e.stopPropagation()}
    />
  );
}

type CellValue = string | number | boolean | null | undefined;

export type BulkDeleteOptions = {
  deleteLinkedBookings?: boolean;
};

export function BulkActionsMenu({
  selection,
  entityLabel,
  onDelete,
  showDeleteLinkedBookingsOption = false,
}: {
  selection: BulkSelection;
  entityLabel: string;
  onDelete: (
    ids: string[],
    options?: BulkDeleteOptions
  ) => Promise<{ error?: string } | void>;
  showDeleteLinkedBookingsOption?: boolean;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteLinkedBookings, setDeleteLinkedBookings] = useState(false);

  const count = selection.selectedCount;
  const labelPlural = pluralize(entityLabel, count);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const result = await onDelete(
      selection.selectedIds,
      showDeleteLinkedBookingsOption
        ? { deleteLinkedBookings }
        : undefined
    );
    setLoading(false);
    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }
    selection.clear();
    setConfirmOpen(false);
    setDeleteLinkedBookings(false);
    router.refresh();
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={count === 0}
          >
            Actions
            {count > 0 ? ` (${count})` : ""}
            <ChevronDown className="h-4 w-4 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className="z-[200] w-48 bg-background"
        >
          <DropdownMenuLabel>Group actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-destructive focus:text-destructive"
            disabled={count === 0}
            onSelect={() => {
              setError(null);
              setDeleteLinkedBookings(false);
              setConfirmOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmYesNoDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          setConfirmOpen(next);
          if (!next) {
            setError(null);
            setDeleteLinkedBookings(false);
          }
        }}
        title={`Delete ${labelPlural}?`}
        description={
          error
            ? error
            : `Delete ${count} selected ${labelPlural}? This cannot be undone.`
        }
        yesLabel="Delete"
        noLabel="Cancel"
        loading={loading}
        onYes={handleDelete}
        onNo={() => setConfirmOpen(false)}
      >
        {showDeleteLinkedBookingsOption && !error ? (
          <DeleteLinkedBookingsCheckbox
            id="bulk-delete-linked-bookings"
            checked={deleteLinkedBookings}
            onCheckedChange={setDeleteLinkedBookings}
          />
        ) : null}
      </ConfirmYesNoDialog>
    </>
  );
}

export function BulkTableToolbar({
  selection,
  entityLabel,
  onDelete,
  exportFilename,
  exportRows,
  exportColumns,
  exportTitle,
  className,
  showExport = true,
  showDeleteLinkedBookingsOption = false,
}: {
  selection: BulkSelection;
  entityLabel: string;
  onDelete: (
    ids: string[],
    options?: BulkDeleteOptions
  ) => Promise<{ error?: string } | void>;
  exportFilename?: string;
  exportRows?: Record<string, CellValue>[];
  exportColumns?: string[];
  exportTitle?: string;
  className?: string;
  showExport?: boolean;
  showDeleteLinkedBookingsOption?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative z-20 mb-2 flex flex-wrap items-center justify-end gap-2",
        className
      )}
    >
      <BulkActionsMenu
        selection={selection}
        entityLabel={entityLabel}
        onDelete={onDelete}
        showDeleteLinkedBookingsOption={showDeleteLinkedBookingsOption}
      />
      {showExport && exportFilename && exportRows ? (
        <ExportMenuButton
          filename={exportFilename}
          rows={exportRows}
          columns={exportColumns}
          title={exportTitle}
        />
      ) : null}
    </div>
  );
}

function pluralize(word: string, count: number) {
  if (count === 1) return word;
  if (word.endsWith("y") && !/[aeiou]y$/i.test(word)) {
    return `${word.slice(0, -1)}ies`;
  }
  if (
    word.endsWith("s") ||
    word.endsWith("x") ||
    word.endsWith("z") ||
    word.endsWith("ch") ||
    word.endsWith("sh")
  ) {
    return `${word}es`;
  }
  return `${word}s`;
}

/** Narrow checkbox column header / cell classes */
export const bulkCheckboxHeadClass =
  "w-10 px-3 py-3 text-left text-sm font-medium";
export const bulkCheckboxCellClass = "px-3 py-3";

