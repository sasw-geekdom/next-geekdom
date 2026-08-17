"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Single-select listbox, replacing the native `<select>`.
 *
 * Modelled on the CMS combobox in the sibling `next-sasw` repo, with three
 * changes that matter here:
 *
 *   1. IT PARTICIPATES IN A FORM. The public forms read their values with
 *      `new FormData(form)`, and a <button> contributes nothing to that. This
 *      renders a hidden input carrying `name`, so the surrounding form keeps
 *      working exactly as it did with a native select.
 *   2. `aria-activedescendant` — the button keeps focus while the arrow keys
 *      move through the list, so without it a screen reader is told nothing
 *      about which option is current.
 *   3. The active option is scrolled into view. With a scrolling list, arrowing
 *      past the visible rows otherwise moves a highlight nobody can see.
 *
 * Deliberately NOT a text input. A true editable combobox invites people to
 * type values that aren't on the list; every use here is a closed set that the
 * server validates against an enum, so it's a listbox with a search field.
 */

export interface ComboboxOption {
  value: string;
  label: string;
}

export function Combobox({
  name,
  options,
  defaultValue = "",
  onChange,
  placeholder = "Pick one…",
  searchPlaceholder = "Search…",
  emptyMessage = "Nothing found.",
  id,
  invalid = false,
  describedBy,
  disabled,
  className,
}: {
  /** Field name submitted with the form. */
  name: string;
  options: readonly ComboboxOption[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  id?: string;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [value, setValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const listId = React.useId();
  const optionId = (i: number) => `${listId}-opt-${i}`;

  const selected = options.find((o) => o.value === value);
  // Short lists read as a clean menu; a search box on five items is clutter.
  const showSearch = options.length > 7;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  // Opening should land on the current selection, not the top of the list.
  const openList = React.useCallback(() => {
    const i = filtered.findIndex((o) => o.value === value);
    setActive(i >= 0 ? i : 0);
    setOpen(true);
  }, [filtered, value]);

  const close = React.useCallback(
    (refocus = true) => {
      setOpen(false);
      setQuery("");
      if (refocus) buttonRef.current?.focus();
    },
    [],
  );

  // Close on outside pointerdown. `pointerdown` rather than `click` so the list
  // is gone before a click lands on whatever is underneath.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, close]);

  // Focus the search field on open, and keep the active row visible as the
  // arrow keys move it.
  React.useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function commit(option: ComboboxOption) {
    setValue(option.value);
    onChange?.(option.value);
    close();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(filtered.length - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[active]) commit(filtered[active]);
        break;
      case "Tab":
        // Tabbing away is a dismissal, not a selection — and the browser
        // should be allowed to move focus onward normally.
        close(false);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {/*
        The actual form value. Not `type="hidden"` with `required`: hidden
        inputs are barred from constraint validation, so that would be a silent
        no-op. These forms submit with `noValidate` and are validated server-side
        by zod anyway, which is what produces the error shown below the field.
      */}
      <input type="hidden" name={name} value={value} />

      <button
        ref={buttonRef}
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        // Only reference the list when it exists — pointing at an absent id is
        // invalid ARIA and some screen readers announce nothing at all.
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && filtered[active] ? optionId(active) : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-lg border border-border bg-white px-3.5 text-left text-base",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          invalid && "border-rust ring-1 ring-rust",
        )}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronsUpDown
          className="ml-2 h-4 w-4 shrink-0 text-muted-foreground"
          strokeWidth={1.6}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-white shadow-lg">
          {showSearch && (
            <div className="border-b border-border p-2">
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="h-9 w-full rounded-md bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          )}

          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={placeholder}
            // Focus stays on the button (or the search field) — the list is
            // driven entirely by aria-activedescendant.
            tabIndex={-1}
            className="max-h-60 overflow-y-auto p-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                {emptyMessage}
              </li>
            ) : (
              filtered.map((option, i) => {
                const isSelected = option.value === value;
                return (
                  <li
                    key={option.value}
                    id={optionId(i)}
                    data-index={i}
                    role="option"
                    aria-selected={isSelected}
                    onPointerEnter={() => setActive(i)}
                    onClick={() => commit(option)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm",
                      i === active && "bg-sand-deep",
                      isSelected && "font-medium text-rust",
                    )}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <Check
                        className="h-4 w-4 shrink-0"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
