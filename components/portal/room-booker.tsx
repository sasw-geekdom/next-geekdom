"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { Tile } from "@/components/portal/tile";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import { RoomTimeline } from "@/components/rooms/room-timeline";
import { MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";
import { bookRoom, cancelMyBooking, extendMyBooking } from "@/lib/rooms/actions";
import { BOOKING_WINDOW, ROOM_RULES, SLOT_MS, addDays, centralDay, currentSlotStart, dayLabel, lengthLabel, timeLabel, weekKey, windowOf } from "@/lib/rooms/rules";
import { CONTACT_EMAIL } from "@/lib/site";

/*
  THE MEMBER'S BOOKING SCREEN. The server page hands over one day's rooms
  and taken time; everything here is a convenience — the server action
  re-checks every rule in a transaction, so a stale screen can only ever
  produce a polite "someone just booked that", never a double booking.
*/

interface RoomLite {
  id: string;
  name: string;
  capacity: number;
  features: string[];
  description: string;
}
interface Taken {
  id: string;
  roomId: string;
  start: string;
  end: string;
  mine: boolean;
}
interface Mine {
  id: string;
  roomId: string;
  roomName: string;
  start: string;
  end: string;
  minutes: number;
}

export function RoomBooker({
  canBook,
  now,
  days,
  day,
  slots,
  rooms,
  taken,
  upcoming,
}: {
  canBook: boolean;
  now: number;
  days: string[];
  day: string;
  slots: string[];
  rooms: RoomLite[];
  taken: Taken[];
  upcoming: Mine[];
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [notice, setNotice] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState({ roomId: rooms[0]?.id ?? "", start: "", minutes: 60, note: "" });
  const [error, setError] = React.useState<string | null>(null);

  const firstStart = currentSlotStart(now);
  const isFree = React.useCallback(
    (roomId: string, t: number) =>
      t >= firstStart &&
      !taken.some((b) => b.roomId === roomId && Date.parse(b.start) <= t && Date.parse(b.end) > t) &&
      // Not while you already have a room.
      !upcoming.some((b) => Date.parse(b.start) <= t && Date.parse(b.end) > t),
    [taken, upcoming, firstStart],
  );

  const starts = slots.filter((s) => isFree(draft.roomId, Date.parse(s)));
  const lengths = React.useMemo(() => {
    if (!draft.start) return [];
    const t0 = Date.parse(draft.start);
    const out: number[] = [];
    for (let k = 1; k <= ROOM_RULES.maxMinutes / ROOM_RULES.stepMinutes; k++) {
      const t = t0 + (k - 1) * SLOT_MS;
      if (!slots.includes(new Date(t).toISOString()) || !isFree(draft.roomId, t)) break;
      out.push(k * ROOM_RULES.stepMinutes);
    }
    return out;
  }, [draft.start, draft.roomId, slots, isFree]);

  function begin(roomId: string, start?: string) {
    const free = slots.filter((s) => isFree(roomId, Date.parse(s)));
    // A sensible default, not the earliest free slot (on a future day that's
    // midnight): 9 AM, or the next free time after it — or, later today,
    // the next free half hour.
    const nine = slots.find((f) => timeLabel(f) === "9:00 AM") ?? slots[0];
    const fromNine = free.find((f) => Date.parse(f) >= Date.parse(nine)) ?? free[0];
    const s = start ?? fromNine ?? "";
    setDraft({ roomId, start: s, minutes: 60, note: "" });
    setError(null);
    setNotice(null);
    setOpen(true);
  }

  // Keep the length valid as the start or room changes.
  const minutes = lengths.includes(draft.minutes) ? draft.minutes : (lengths.at(-1) ?? 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.start || !minutes) return setError("Pick a start time and a length.");
    startTransition(async () => {
      const res = await bookRoom({ roomId: draft.roomId, start: draft.start, minutes, note: draft.note });
      if (res.ok) {
        setOpen(false);
        setNotice({ ok: true, text: res.message });
      } else setError(res.message);
      router.refresh();
    });
  }

  // The branded cancel (ConfirmDialog) — not the browser's confirm box.
  const [canceling, setCanceling] = React.useState<Mine | null>(null);
  const [cancelError, setCancelError] = React.useState<string | null>(null);
  function cancel(b: Mine) {
    setCancelError(null);
    setCanceling(b);
  }
  function confirmCancel() {
    if (!canceling) return;
    startTransition(async () => {
      const res = await cancelMyBooking(canceling.id);
      if (res.ok) {
        setCanceling(null);
        setNotice({ ok: true, text: res.message });
      } else setCancelError(res.message);
      router.refresh();
    });
  }

  // ADD TIME to one of your bookings (extendMyBooking). The choices stop at
  // 4 hours in all, the close of the day's window, and — when it's the day
  // on screen — the next booking in that room. The server re-checks.
  const [extending, setExtending] = React.useState<string | null>(null);
  const [extendBy, setExtendBy] = React.useState(30);
  const [extendError, setExtendError] = React.useState<string | null>(null);
  function addOptions(b: Mine): number[] {
    const end = Date.parse(b.end);
    const close = windowOf(centralDay(b.start)).to;
    const out: number[] = [];
    for (let m = ROOM_RULES.stepMinutes; b.minutes + m <= ROOM_RULES.maxMinutes; m += ROOM_RULES.stepMinutes) {
      const until = end + m * 60_000;
      if (until > close) break;
      const slot = until - SLOT_MS;
      if (centralDay(b.start) === day && taken.some((t) => t.roomId === b.roomId && t.id !== b.id && Date.parse(t.start) <= slot && Date.parse(t.end) > slot)) break;
      out.push(m);
    }
    return out;
  }
  function addTime(b: Mine) {
    setExtendError(null);
    startTransition(async () => {
      const res = await extendMyBooking(b.id, extendBy);
      if (res.ok) {
        setExtending(null);
        setNotice({ ok: true, text: res.message });
      } else setExtendError(res.message);
      router.refresh();
    });
  }

  const room = rooms.find((r) => r.id === draft.roomId);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
        {notice && (
          <p role={notice.ok ? "status" : "alert"} className={cn("border border-dashed px-4 py-3 text-sm", notice.ok ? "border-border text-graphite" : "border-geekdom-red text-geekdom-red")}>
            {notice.text}
          </p>
        )}

        {/* The weekdays you can book, through the coming week. */}
        <DayCalendar days={days} day={day} today={centralDay(new Date(now))} upcoming={upcoming} />

        <Tile label={dayLabel(day, "long")}>
          <ul className="flex flex-col gap-6">
            {rooms.map((r) => (
              <li key={r.id}>
                <div className="mb-2.5 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <p className="font-medium text-graphite">{r.name}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.7} />
                        Up to {r.capacity}
                      </span>
                      {r.features.map((f) => (
                        <span key={f}>· {f}</span>
                      ))}
                    </p>
                  </div>
                  {canBook && (
                    <Button variant="outline" size="sm" onClick={() => begin(r.id)} disabled={pending || !slots.some((s) => isFree(r.id, Date.parse(s)))}>
                      Book {r.name}
                    </Button>
                  )}
                </div>
                <RoomTimeline
                  slots={slots}
                  now={now}
                  blocks={taken.filter((b) => b.roomId === r.id).map((b) => ({ id: b.id, start: b.start, end: b.end, tone: b.mine ? "mine" : "busy" }))}
                  onPick={canBook ? (s) => begin(r.id, s) : undefined}
                  canPick={(s) => isFree(r.id, Date.parse(s))}
                  pickLabel={`Book ${r.name} at`}
                />
              </li>
            ))}
          </ul>
          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-4 border border-border bg-bone-light" /> Free — click to book</span>
            <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-4 bg-graphite/15" /> Booked</span>
            <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-4 bg-clay" /> Yours</span>
            <span>Bookable {BOOKING_WINDOW.daysLabel}, {BOOKING_WINDOW.label}</span>
          </p>
        </Tile>
      </div>

      <div className="flex flex-col gap-4">
        <Tile label="Your bookings">
          {!canBook ? (
            <p className="text-sm text-muted-foreground">Booking a room is for current members.</p>
          ) : upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing booked. Pick a free time on any room.</p>
          ) : (
            <ul>
              {upcoming.map((b) => {
                const options = addOptions(b);
                const open = extending === b.id;
                return (
                  <li key={b.id} className="border-t border-border py-3 first:border-t-0 first:pt-0">
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block font-medium text-graphite">{b.roomName}</span>
                        <span className="block text-sm text-muted-foreground">
                          {dayLabel(centralDay(b.start))} · {timeLabel(b.start)} – {timeLabel(b.end)}
                          {Date.parse(b.start) <= now && <span className="text-graphite"> · Now</span>}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3 text-sm">
                        {!open && options.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setExtending(b.id);
                              setExtendBy(options[0]);
                              setExtendError(null);
                            }}
                            disabled={pending}
                            className="text-graphite underline decoration-clay decoration-1 underline-offset-2"
                          >
                            Add time
                          </button>
                        )}
                        {Date.parse(b.start) > now && (
                          <button type="button" onClick={() => cancel(b)} disabled={pending} className="text-graphite underline decoration-clay decoration-1 underline-offset-2">
                            Cancel
                          </button>
                        )}
                      </span>
                    </div>
                    {open && (
                      <div className="mt-3 flex flex-col gap-2">
                        <div className="flex items-end gap-2">
                          <Field label="Add" htmlFor={`add-${b.id}`} className="w-36">
                            <Combobox
                              id={`add-${b.id}`}
                              name="add"
                              options={options.map((m) => ({ value: String(m), label: `${lengthLabel(m)} · until ${timeLabel(new Date(Date.parse(b.end) + m * 60_000).toISOString())}` }))}
                              value={String(extendBy)}
                              onChange={(v) => setExtendBy(Number(v))}
                              searchable={false}
                            />
                          </Field>
                          <Button type="button" variant="ink" size="sm" onClick={() => addTime(b)} disabled={pending}>
                            {pending ? "Adding…" : "Add"}
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setExtending(null)} disabled={pending}>
                            Cancel
                          </Button>
                        </div>
                        {extendError && (
                          <p role="alert" className="text-sm text-geekdom-red">
                            {extendError}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Tile>

        <Tile label="How it works">
          <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            <li>Book in 30-minute steps, up to {lengthLabel(ROOM_RULES.maxMinutes)} at a time.</li>
            <li>Running long? Add time to your booking while the room is free after it.</li>
            <li>{BOOKING_WINDOW.daysLabel}, {BOOKING_WINDOW.label}, up to a week ahead.</li>
          </ul>
          {/* The Club is open 24/7; the booking window isn't. The way around it is a person. */}
          <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
            Need a room on a weekend, or outside {BOOKING_WINDOW.label}?{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Booking a room outside weekday hours")}`}
              className="text-graphite underline decoration-clay decoration-1 underline-offset-2"
            >
              Email the Club team
            </a>{" "}
            and they&rsquo;ll set it up.
          </p>
        </Tile>
      </div>

      <ConfirmDialog
        open={Boolean(canceling)}
        title="Cancel this booking?"
        details={
          canceling
            ? [
                ["Room", canceling.roomName],
                ["When", `${dayLabel(centralDay(canceling.start))} · ${timeLabel(canceling.start)} – ${timeLabel(canceling.end)}`],
                ["Length", lengthLabel(canceling.minutes)],
              ]
            : undefined
        }
        confirmLabel="Cancel booking"
        pendingLabel="Canceling…"
        keepLabel="Keep it"
        pending={pending && Boolean(canceling)}
        error={cancelError}
        onConfirm={confirmCancel}
        onClose={() => setCanceling(null)}
      >
        The room opens up for another member.
      </ConfirmDialog>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={room ? `Book ${room.name}` : "Book a room"}
        description={`${dayLabel(day, "long")} · change the day on the page`}
        footer={
          <>
            <Button type="submit" form="book-form" variant="ink" disabled={pending || !draft.start || !minutes}>
              {pending ? "Booking…" : minutes ? `Book ${timeLabel(draft.start)} – ${timeLabel(new Date(Date.parse(draft.start) + minutes * 60_000).toISOString())}` : "Book"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
          </>
        }
      >
        <form id="book-form" onSubmit={submit} noValidate className="flex flex-col gap-5">
          <Field label="Room" htmlFor="bk-room">
            <Combobox
              id="bk-room"
              name="room"
              options={rooms.map((r) => ({ value: r.id, label: `${r.name} · up to ${r.capacity}` }))}
              value={draft.roomId}
              onChange={(v) => {
                const free = slots.filter((s) => isFree(v, Date.parse(s)));
                setDraft((d) => ({ ...d, roomId: v, start: free.includes(d.start) ? d.start : (free[0] ?? "") }));
              }}
              searchable={false}
            />
          </Field>
          {room && room.features.length > 0 && <p className={cn(MONO.label, "-mt-2 text-muted-foreground")}>{room.features.join(" · ")}</p>}
          {starts.length === 0 ? (
            <p className="border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">No free time left in {room?.name} on this day. Try another room or day.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts" htmlFor="bk-start">
                <Combobox id="bk-start" name="start" options={starts.map((s) => ({ value: s, label: timeLabel(s) }))} value={draft.start} onChange={(v) => setDraft((d) => ({ ...d, start: v }))} />
              </Field>
              <Field label="For" htmlFor="bk-len">
                <Combobox
                  id="bk-len"
                  name="length"
                  options={lengths.map((m) => ({ value: String(m), label: lengthLabel(m) }))}
                  value={minutes ? String(minutes) : ""}
                  onChange={(v) => setDraft((d) => ({ ...d, minutes: Number(v) }))}
                  searchable={false}
                  placeholder="—"
                />
              </Field>
            </div>
          )}
          {draft.start && (
            <p className="text-[13px] text-muted-foreground">
              Longest here: {lengths.length ? lengthLabel(lengths.at(-1)!) : "—"} ({lengthLabel(ROOM_RULES.maxMinutes)} at most, and it has to be free). You can add time later.
            </p>
          )}
          <Field label="What's it for? (optional)" htmlFor="bk-note" hint="Only the Geekdom team sees this.">
            <Input id="bk-note" value={draft.note} maxLength={200} onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))} placeholder="Team standup, investor call…" />
          </Field>
          {error && (
            <p role="alert" className="text-sm text-geekdom-red">
              {error}
            </p>
          )}
        </form>
      </Drawer>
    </div>
  );
}

/*
  THE DAY PICKER — the bookable weekdays of the coming week on a
  Monday-to-Friday calendar, one row per calendar week (weekends aren't
  bookable: staff aren't in — a weekend room goes through the Club team).
  One weekday header, short tiles with just the date, days before today or
  past the horizon shown faint, and a Clay marker on days you already have
  a room. (The "time left this week" line went with the weekly cap.)
*/
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const noonOf = (d: string) => `${d}T18:00:00.000Z`; // midday Central, either offset

function DayCalendar({
  days,
  day,
  today,
  upcoming,
}: {
  days: string[];
  day: string;
  /** The real today — on a weekend it isn't in `days`. */
  today: string;
  upcoming: Mine[];
}) {
  const booked = new Set(upcoming.map((b) => centralDay(b.start)));

  const weeks: string[] = [];
  for (let w = weekKey(noonOf(days[0])); w <= days[days.length - 1]; w = addDays(w, 7)) weeks.push(w);
  // (days holds only weekdays, so a faint tile is before today or past the horizon.)

  return (
    <div className="border border-border bg-bone-light p-3 sm:p-4">
      <div className="grid grid-cols-5 gap-1.5" aria-hidden="true">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-center text-[11px] text-muted-foreground">
            {w}
          </span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-5 gap-1.5">
        {/* Monday to Friday of each week (its key is the Sunday before). */}
        {weeks.flatMap((w) => Array.from({ length: 5 }, (_, i) => addDays(w, i + 1))).map((d) => {
          const num = Number(d.slice(8));
          if (!days.includes(d)) {
            return (
              <span key={d} aria-hidden="true" className="flex h-9 items-center justify-center text-sm tabular-nums text-muted-foreground/40">
                {num}
              </span>
            );
          }
          const selected = d === day;
          return (
            <Link
              key={d}
              href={`/portal/rooms?day=${d}`}
              scroll={false}
              aria-current={selected ? "date" : undefined}
              aria-label={`${dayLabel(d, "long")}${d === today ? " (today)" : ""}${booked.has(d) ? ", you have a booking" : ""}`}
              className={cn(
                "relative flex h-9 items-center justify-center border text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay",
                selected ? "border-graphite bg-graphite text-bone" : "border-border bg-bone text-graphite hover:border-graphite",
                // Today: a Clay rule under the date — a marker, never a fill.
                d === today && !selected && "border-b-2 border-b-clay",
              )}
            >
              {num}
              {booked.has(d) && <span aria-hidden="true" className="absolute top-1 right-1 h-1.5 w-1.5 bg-clay" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
