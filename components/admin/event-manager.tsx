"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import { Drawer } from "@/components/ui/drawer";
import { FieldGroup } from "@/components/admin/field-group";
import { MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";
import {
  centralParts,
  eventTimeLabel,
  fromCentral,
} from "@/lib/content/dates";
import { deleteEvent, saveEvent, seedEventsFromSite } from "@/lib/content/event-actions";
import type { ActionResult } from "@/lib/content/types";

/*
  "THIS MONTH IN THE CLUB", EDITED.

  A list of every event — upcoming first, past ones folded below — and one
  editor that opens above it for a new event or the one being edited. Saving
  expires the homepage's cache, so the change is live on the next request.

  EVERY PICKER IS THE CUSTOM COMBOBOX. Month, day, year and both times are
  closed lists: no native <select>, no native date picker, and no typed date
  format to get wrong. Times are Central, in 15-minute steps.
*/

export interface AdminEvent {
  id: string;
  title: string;
  href: string;
  host: string | null;
  startsAt: string;
  endsAt: string;
  dateLabel: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
].map((label, i) => ({ value: String(i + 1).padStart(2, "0"), label }));

const DAYS = Array.from({ length: 31 }, (_, i) => {
  const v = String(i + 1).padStart(2, "0");
  return { value: v, label: String(i + 1) };
});

const TIMES = Array.from({ length: 96 }, (_, i) => {
  const h = String(Math.floor(i / 4)).padStart(2, "0");
  const m = String((i % 4) * 15).padStart(2, "0");
  const value = `${h}:${m}`;
  // Label through the same formatter the site uses, on a fixed winter date.
  return { value, label: eventTimeLabel(fromCentral("2026", "01", "15", value)!) };
});

interface Draft {
  id?: string;
  title: string;
  href: string;
  host: string;
  year: string;
  month: string;
  day: string;
  startTime: string;
  endTime: string;
}

function blank(): Draft {
  const today = centralParts(new Date().toISOString());
  return {
    title: "",
    href: "",
    host: "",
    year: today.year,
    month: today.month,
    day: today.day,
    startTime: "18:00",
    endTime: "20:00",
  };
}

function fromEvent(e: AdminEvent): Draft {
  const s = centralParts(e.startsAt);
  return {
    id: e.id,
    title: e.title,
    href: e.href,
    host: e.host ?? "",
    year: s.year,
    month: s.month,
    day: s.day,
    startTime: s.time,
    endTime: centralParts(e.endsAt).time,
  };
}

export function EventManager({
  events,
  now,
  startAdding = false,
}: {
  /** Open "Add an event" straight away — the Overview's quick action (?add=1). */
  startAdding?: boolean;
  events: AdminEvent[];
  /** Server time, so "upcoming" doesn't shift between server and client. */
  now: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [draft, setDraft] = React.useState<Draft | null>(() => (startAdding ? blank() : null));
  // Separate from `draft` so the form stays rendered while the panel slides out.
  const [drawerOpen, setDrawerOpen] = React.useState(startAdding);
  const close = React.useCallback(() => setDrawerOpen(false), []);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [notice, setNotice] = React.useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );

  const upcoming = events.filter((e) => Date.parse(e.endsAt) > now);
  const past = events.filter((e) => Date.parse(e.endsAt) <= now).reverse();

  const thisYear = Number(centralParts(new Date(now).toISOString()).year);
  const YEARS = [thisYear - 1, thisYear, thisYear + 1, thisYear + 2].map((y) => ({
    value: String(y),
    label: String(y),
  }));

  function open(d: Draft) {
    setDraft(d);
    setErrors({});
    setNotice(null);
    setDrawerOpen(true);
  }

  function report(res: ActionResult, okText: string) {
    if (res.ok) {
      setNotice({ tone: "ok", text: okText });
      setDrawerOpen(false);
      setErrors({});
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      if (res.error) setNotice({ tone: "error", text: res.error });
    }
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    startTransition(async () => {
      const res = await saveEvent({ ...draft, host: draft.host || undefined });
      report(res, draft.id ? "Saved. The homepage has the change." : "Added to the homepage.");
    });
  }

  function onDelete(ev: AdminEvent) {
    if (!window.confirm(`Delete “${ev.title}”? This can't be undone.`)) return;
    startTransition(async () => {
      report(await deleteEvent(ev.id), "Deleted.");
    });
  }

  function onSeed() {
    startTransition(async () => {
      const res = await seedEventsFromSite();
      report(res, res.ok ? `Copied ${res.count} events from the current site.` : "");
    });
  }

  const set = <K extends keyof Draft>(k: K) => (v: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ink" onClick={() => open(blank())} disabled={pending}>
          <Plus className="h-4 w-4" strokeWidth={1.8} />
          Add an event
        </Button>
        {events.length === 0 && (
          <Button variant="outline" onClick={onSeed} disabled={pending}>
            Copy from the current site
          </Button>
        )}
        {notice && (
          <p
            role={notice.tone === "error" ? "alert" : "status"}
            className={cn("text-sm", notice.tone === "error" ? "text-geekdom-red" : "text-graphite")}
          >
            {notice.text}
          </p>
        )}
      </div>

      <Drawer
        open={drawerOpen}
        onClose={close}
        eyebrow={draft?.id ? "Edit event" : "New event"}
        title={draft?.id ? "Edit this event" : "Add an event"}
        footer={
          <>
            <Button type="submit" form="event-form" variant="ink" disabled={pending}>
              {pending ? "Saving…" : draft?.id ? "Save changes" : "Add to the homepage"}
            </Button>
            <Button type="button" variant="ghost" onClick={close} disabled={pending}>
              Cancel
            </Button>
          </>
        }
      >
        {draft && (
          <form id="event-form" onSubmit={onSave} noValidate className="flex flex-col gap-10">
            <FieldGroup title="Event">
              <Field label="Title" htmlFor="ev-title" error={errors.title} required>
                <Input
                  id="ev-title"
                  value={draft.title}
                  onChange={(e) => set("title")(e.target.value)}
                  aria-invalid={Boolean(errors.title)}
                  placeholder="SATX Open Coffee Club at Crème Coffee & Social"
                  data-autofocus
                />
              </Field>
              <Field
                label="Link"
                htmlFor="ev-href"
                error={errors.href}
                required
                hint="The event's own page — Luma, Meetup, sasw.co. Opens in a new tab."
              >
                <Input
                  id="ev-href"
                  type="url"
                  inputMode="url"
                  value={draft.href}
                  onChange={(e) => set("href")(e.target.value)}
                  aria-invalid={Boolean(errors.href)}
                  placeholder="https://luma.com/…"
                />
              </Field>
              <Field
                label="Host"
                htmlFor="ev-host"
                error={errors.host}
                hint="Shown under the title as “Hosted by …”. Leave blank for Geekdom's own events."
              >
                <Input
                  id="ev-host"
                  value={draft.host}
                  onChange={(e) => set("host")(e.target.value)}
                  placeholder="San Antonio AWS User Group"
                />
              </Field>
            </FieldGroup>

            <FieldGroup title="When">
              <Field label="Date" htmlFor="ev-month" error={errors.day ?? errors.month ?? errors.year} required>
                <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2">
                  <Combobox
                    id="ev-month"
                    name="month"
                    options={MONTHS}
                    value={draft.month}
                    onChange={set("month")}
                    placeholder="Month"
                    searchable={false}
                  />
                  <Combobox
                    name="day"
                    options={DAYS}
                    value={draft.day}
                    onChange={set("day")}
                    placeholder="Day"
                    searchable={false}
                    invalid={Boolean(errors.day)}
                  />
                  <Combobox
                    name="year"
                    options={YEARS}
                    value={draft.year}
                    onChange={set("year")}
                    placeholder="Year"
                  />
                </div>
              </Field>
              <Field
                label="Time (Central)"
                htmlFor="ev-start"
                error={errors.startTime ?? errors.endTime}
                required
                hint="The row leaves the homepage when the event ends."
              >
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <Combobox
                    id="ev-start"
                    name="startTime"
                    options={TIMES}
                    value={draft.startTime}
                    onChange={set("startTime")}
                    placeholder="Starts"
                    searchPlaceholder="Type a time, e.g. 6:00"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Combobox
                    name="endTime"
                    options={TIMES}
                    value={draft.endTime}
                    onChange={set("endTime")}
                    placeholder="Ends"
                    searchPlaceholder="Type a time, e.g. 8:00"
                    invalid={Boolean(errors.endTime)}
                  />
                </div>
              </Field>
            </FieldGroup>
          </form>
        )}
      </Drawer>

      <EventList
        title="On the homepage"
        empty={
          events.length === 0
            ? "No events yet. The homepage is showing the site's built-in list until you add one or copy it here."
            : "Nothing upcoming. The homepage shows only the calendar link until an event is added."
        }
        events={upcoming}
        onEdit={(e) => open(fromEvent(e))}
        onDelete={onDelete}
        disabled={pending}
      />
      {/*
        PAST EVENTS, FOLDED AWAY. They're off the site already; kept here so a
        recurring event can be copied or a mistake looked up, but closed by
        default so the list you open the page for is the one that's live.
        A native <details>: keyboard and screen-reader support for free.
      */}
      {past.length > 0 && (
        <details className="group/past border-t border-border">
          <summary className="flex cursor-pointer list-none items-center justify-between py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone [&::-webkit-details-marker]:hidden">
            <span className={cn(MONO.label, "text-muted-foreground")}>
              Past events · {past.length}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open/past:rotate-180"
              strokeWidth={1.7}
            />
          </summary>
          <EventList
            events={past}
            onEdit={(e) => open(fromEvent(e))}
            onDelete={onDelete}
            disabled={pending}
            muted
          />
        </details>
      )}
    </div>
  );
}

function EventList({
  title,
  events,
  empty,
  onEdit,
  onDelete,
  disabled,
  muted = false,
}: {
  /** Omitted when the list sits under its own heading (the Past accordion). */
  title?: string;
  events: AdminEvent[];
  empty?: string;
  onEdit: (e: AdminEvent) => void;
  onDelete: (e: AdminEvent) => void;
  disabled: boolean;
  muted?: boolean;
}) {
  return (
    <section>
      {title && <h2 className={cn(MONO.label, "text-muted-foreground")}>{title}</h2>}
      {events.length === 0 ? (
        <p className="mt-3 border border-dashed border-border bg-bone-light px-6 py-10 text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="mt-3 border-b border-border">
          {events.map((ev) => (
            <li
              key={ev.id}
              className={cn(
                "grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-t border-border py-4 sm:grid-cols-[10rem_1fr_auto]",
                muted && "opacity-60",
              )}
            >
              <span className={cn(MONO.label, "text-muted-foreground")}>
                {ev.dateLabel} · {eventTimeLabel(ev.startsAt)}
              </span>
              <div className="col-span-2 min-w-0 sm:col-span-1">
                <a
                  href={ev.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group inline-flex max-w-full items-center gap-1.5 text-graphite"
                >
                  <span className="truncate">{ev.title}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                {ev.host && <p className="truncate text-sm text-muted-foreground">Hosted by {ev.host}</p>}
              </div>
              <div className="col-start-2 row-start-1 flex items-center gap-1 sm:col-start-3">
                <Button variant="ghost" size="icon" onClick={() => onEdit(ev)} disabled={disabled} aria-label={`Edit ${ev.title}`}>
                  <Pencil className="h-4 w-4" strokeWidth={1.7} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(ev)} disabled={disabled} aria-label={`Delete ${ev.title}`}>
                  <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
