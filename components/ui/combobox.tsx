"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Single-select listbox, replacing the native `<select>`.
 *
 * Modeled on the CMS combobox in the sibling `next-sasw` repo, with three
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

/** The list's height limits, in px. 240 is the old `max-h-60`. */
const LIST_MAX = 240;
const LIST_MIN = 120;
const SEARCH_HEIGHT = 53;
const LIST_PADDING = 10;
const GAP = 8;

/** The visible box the list must fit in: the nearest scroller, clipped to the viewport. */
function scrollBounds(el: HTMLElement): { top: number; bottom: number } {
  let top = 0;
  let bottom = window.innerHeight;
  for (let n = el.parentElement; n; n = n.parentElement) {
    const { overflowY } = getComputedStyle(n);
    if (overflowY === "auto" || overflowY === "scroll") {
      const r = n.getBoundingClientRect();
      top = Math.max(top, r.top);
      bottom = Math.min(bottom, r.bottom);
      break;
    }
  }
  return { top, bottom };
}

export interface ComboboxOption {
  value: string;
  label: string;
}

export function Combobox({
  name,
  options,
  defaultValue = "",
  value: controlled,
  onChange,
  searchable,
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
  /**
   * Controlled value. Pass it with `onChange` when a parent owns the state
   * (the admin forms, which reset between records); omit it and the
   * component keeps its own, starting from `defaultValue`.
   */
  value?: string;
  onChange?: (value: string) => void;
  /** Force the search field on or off. Default: on for more than 7 options. */
  searchable?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  id?: string;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [own, setOwn] = React.useState(defaultValue);
  const value = controlled ?? own;
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
  const showSearch = searchable ?? options.length > 7;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  // Opening should land on the current selection, not the top of the list.
  /*
    WHERE THE LIST OPENS, decided on open. Below by default; ABOVE when
    there isn't room below inside the nearest scrolling box (the admin's
    slide-out body, or the viewport) and there's more room above. Its height
    is capped to the space it gets. An absolutely positioned list that hangs
    past the bottom of a scroll container makes the container taller — the
    slide-out grew and jumped every time a date or time field opened.
  */
  const [place, setPlace] = React.useState<{ up: boolean; max: number }>({
    up: false,
    max: LIST_MAX,
  });

  const openList = React.useCallback(() => {
    const i = filtered.findIndex((o) => o.value === value);
    setActive(i >= 0 ? i : 0);
    const button = buttonRef.current;
    if (button) {
      const r = button.getBoundingClientRect();
      const box = scrollBounds(button);
      const below = box.bottom - r.bottom - GAP;
      const above = r.top - box.top - GAP;
      const chrome = (showSearch ? SEARCH_HEIGHT : 0) + LIST_PADDING;
      const up = below < LIST_MAX + chrome && above > below;
      const room = (up ? above : below) - chrome;
      setPlace({ up, max: Math.max(LIST_MIN, Math.min(LIST_MAX, room)) });
    }
    setOpen(true);
  }, [filtered, value, showSearch]);

  const close = React.useCallback(
    (refocus = true) => {
      setOpen(false);
      setQuery("");
      if (refocus) buttonRef.current?.focus();
    },
    [],
  );

  /*
    THE LABEL'S FORWARDED CLICK, swallowed once — so it can't reopen the
    list that a press on that label just closed. Every Field puts a <label for=…> on this button, and a
    click on a label is forwarded to its control: press the label "Started"
    while the list is open and pointerdown closed it, then the forwarded click
    toggled it straight back open. It read as a dropdown only its own button
    could close.
  */
  const swallowLabelClick = React.useRef(false);

  // Close on any press outside. `pointerdown` rather than `click` so the list
  // is gone before a click lands on whatever is underneath; CAPTURE phase so
  // nothing underneath that stops propagation can keep it open.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        // Only a press on OUR label is followed by a forwarded click.
        const label = (e.target as Element | null)?.closest?.("label");
        swallowLabelClick.current = label?.control === buttonRef.current;
        close(false);
      }
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [open, close]);

  // And when focus leaves it some other way — a script, a screen reader's
  // virtual cursor — the list shouldn't stay open behind the user's back.
  function onBlurWithin(e: React.FocusEvent) {
    if (open && !rootRef.current?.contains(e.relatedTarget as Node | null)) close(false);
  }

  // Focus the search field on open, and keep the active row visible as the
  // arrow keys move it.
  // preventScroll: focusing would otherwise scroll every container above it.
  React.useEffect(() => {
    if (!open) return;
    searchRef.current?.focus({ preventScroll: true });
  }, [open]);

  /*
    Keep the active row visible by scrolling THE LIST ONLY. This was
    `scrollIntoView`, which scrolls every scrollable ancestor too — with the
    6:00 PM row deep in a 96-item time list, the whole slide-out lurched
    200px to bring it into view.
  */
  React.useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!list || !row) return;
    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = bottom - list.clientHeight;
    }
  }, [active, open]);

  function commit(option: ComboboxOption) {
    if (controlled === undefined) setOwn(option.value);
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
    <div ref={rootRef} onBlur={onBlurWithin} className={cn("relative", className)}>
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
        // A real press on the button is never a forwarded label click — clear
        // a flag left over from a label press that never became a click.
        onPointerDown={() => {
          swallowLabelClick.current = false;
        }}
        onClick={() => {
          if (open) return close();
          // The label-forwarded click right after an outside close (above).
          if (swallowLabelClick.current) {
            swallowLabelClick.current = false;
            return;
          }
          openList();
        }}
        onKeyDown={onKeyDown}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-none border border-border bg-bone-light px-3.5 text-left text-base",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          invalid && "border-clay ring-1 ring-clay",
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
        <div
          className={cn(
            "absolute z-50 w-full overflow-hidden border border-border bg-bone-light shadow-lg",
            place.up ? "bottom-full mb-1" : "top-full mt-1",
          )}
          // Keep focus where it is while the pointer is on the list: pressing
          // an option would otherwise blur the field (onBlurWithin) and close
          // the list before the click could select. The search field is the
          // one thing in here that should take focus.
          onMouseDown={(e) => {
            if (e.target !== searchRef.current) e.preventDefault();
          }}
        >
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
                className="h-9 w-full bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
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
            style={{ maxHeight: place.max }}
            className="relative overflow-y-auto p-1"
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
                      // The highlight is a Clay rule on a Bone row. It used to
                      // be `bg-bone-light` — the popover's own ground, so the
                      // row the arrow keys were on was invisible.
                      "flex cursor-pointer items-center justify-between gap-3 border-l-2 px-3 py-2 text-sm",
                      i === active ? "border-clay bg-bone" : "border-transparent",
                      isSelected && "font-medium text-graphite",
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
