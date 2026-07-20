"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getAccountDisplayName, type Account } from "@/lib/types";
import { ChevronDown, X } from "lucide-react";

type AccountOption = Pick<Account, "id" | "name"> & {
  nickname?: string | null;
};

function matchesQuery(account: AccountOption, query: string) {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return true;
  const nickname = (account.nickname || "").toLocaleLowerCase();
  const name = (account.name || "").toLocaleLowerCase();
  return nickname.startsWith(q) || name.startsWith(q);
}

export function SearchableClientSelect({
  accounts,
  value,
  onChange,
  name = "account_id",
  placeholder = "Type to find a client…",
  allowAll = false,
  allLabel = "All clients",
  emptyLabel = "No clients starting with",
  required = false,
  className,
  id,
}: {
  accounts: AccountOption[];
  value: string;
  onChange: (value: string) => void;
  name?: string;
  placeholder?: string;
  /** When true, empty selection means "all" (for filters) */
  allowAll?: boolean;
  allLabel?: string;
  emptyLabel?: string;
  required?: boolean;
  className?: string;
  id?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => accounts.find((a) => a.id === value) || null,
    [accounts, value]
  );

  const filtered = useMemo(() => {
    const list = accounts
      .filter((a) => matchesQuery(a, query))
      .sort((a, b) =>
        getAccountDisplayName(a).localeCompare(getAccountDisplayName(b))
      );
    return list;
  }, [accounts, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectValue(next: string) {
    onChange(next);
    setOpen(false);
    setQuery("");
  }

  function clearSelection() {
    onChange(allowAll ? "all" : "");
    setQuery("");
    setOpen(true);
    inputRef.current?.focus();
  }

  const displayValue = open
    ? query
    : selected
      ? getAccountDisplayName(selected)
      : allowAll && (!value || value === "all")
        ? allLabel
        : "";

  return (
    <div ref={rootRef} className={cn("relative w-full max-w-xs", className)}>
      <input
        type="hidden"
        name={name}
        value={allowAll && value === "all" ? "" : value}
        required={required && !(allowAll && value === "all")}
      />
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={placeholder}
          value={displayValue}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setQuery("");
            }
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered.length === 1) {
                selectValue(filtered[0].id);
              } else if (allowAll && !query.trim()) {
                selectValue("all");
              }
            }
          }}
          className="pr-16"
        />
        <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
          {(selected || (allowAll && value && value !== "all")) && (
            <button
              type="button"
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear client"
              onClick={clearSelection}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Toggle client list"
            onClick={() => {
              setOpen((v) => !v);
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background py-1 shadow-md"
        >
          {allowAll && !query.trim() && (
            <li>
              <button
                type="button"
                role="option"
                className={cn(
                  "flex w-full px-3 py-2 text-left text-sm hover:bg-accent",
                  (!value || value === "all") && "bg-accent"
                )}
                onClick={() => selectValue("all")}
              >
                {allLabel}
              </button>
            </li>
          )}
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {emptyLabel} “{query.trim()}”
            </li>
          ) : (
            filtered.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={a.id === value}
                  className={cn(
                    "flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-accent",
                    a.id === value && "bg-accent"
                  )}
                  onClick={() => selectValue(a.id)}
                >
                  <span>{getAccountDisplayName(a)}</span>
                  {a.nickname && a.name && a.nickname !== a.name ? (
                    <span className="text-xs text-muted-foreground">{a.name}</span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
