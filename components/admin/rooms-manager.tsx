"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Pencil, Plus, Users } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { Drawer } from "@/components/ui/drawer";
import { RoomTimeline } from "@/components/rooms/room-timeline";
import { ADMIN_LABEL, Status, Table, Td, Th, Tr } from "@/components/admin/admin-ui";
import { cn } from "@/lib/utils";
import { blockRoom, cancelBooking, saveRoom } from "@/lib/rooms/actions";
import { BLOCK_MAX_MINUTES, BOOKING_WINDOW, ROOM_RULES, addDays, dayLabel, isBookableWeekday, lengthLabel, slotsOfDay, timeLabel } from "@/lib/rooms/rules";
import type { Booking, Room } from "@/lib/rooms/rooms";

/*
  THE ROOMS ADMIN, a work tool (Linear/Vercel): a week strip to pick the
  day — each day's count on it, ‹ › by week, Today — then the day's
  summary (bookings, hours, busiest room, blocks) and its reservations as
  a table at the TOP, then the schedule across every room. The rooms and
  the rules sit beside it. The day is in the address, so it can be shared. Three slide-outs: block time, cancel (with a
  reason the member is emailed), and edit a room.
*/

type Pane =
  | { kind: "block"; roomId: string; day: string; start: string; minutes: number; note: string }
  | { kind: "cancel"; booking: Booking; reason: string }
  | { kind: "room"; id?: string; name: string; capacity: string; features: string; description: string; active: boolean }
  /** The rooms and the rules — settings, out of the day's view. */
  | { kind: "rooms" };

export function RoomsManager({
  now,
  today,
  day,
  weekDays,
  prevWeek,
  nextWeek,
  slots,
  rooms,
  bookings,
  startBlocking = false,
}: {
  now: number;
  today: string;
  day: string;
  /** The week the day sits in, Sunday to Saturday, with each day's counts. */
  weekDays: { day: string; bookings: number; blocks: number }[];
  prevWeek: string;
  nextWeek: string;
  slots: string[];
  rooms: Room[];
  bookings: Booking[];
  startBlocking?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const blank = React.useCallback(
    // Today: the next half hour. Another day: 9 AM, not midnight.
    (): Pane => ({
      kind: "block",
      roomId: rooms[0]?.id ?? "",
      day,
      start: day === today ? (slots.find((s) => Date.parse(s) >= now) ?? slots[0]) : (slots.find((s) => timeLabel(s) === "9:00 AM") ?? slots[0]),
      minutes: 60,
      note: "",
    }),
    [rooms, day, today, slots, now],
  );
  const [pane, setPane] = React.useState<Pane | null>(() => (startBlocking ? blank() : null));
  const [open, setOpen] = React.useState(startBlocking);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<{ ok: boolean; text: string } | null>(null);

  function show(p: Pane) {
    setPane(p);
    setErrors({});
    setError(null);
    setNotice(null);
    setOpen(true);
  }
  const close = () => setOpen(false);
  const patch = (p: Partial<Pane>) => setPane((x) => (x ? ({ ...x, ...p } as Pane) : x));

  function done(res: { ok: boolean; message: string; fieldErrors?: Record<string, string> }) {
    if (res.ok) {
      setOpen(false);
      setNotice({ ok: true, text: res.message });
    } else {
      setErrors(res.fieldErrors ?? {});
      setError(res.message);
    }
    router.refresh();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pane) return;
    startTransition(async () => {
      if (pane.kind === "block") done(await blockRoom({ roomId: pane.roomId, start: pane.start, minutes: pane.minutes, note: pane.note }));
      if (pane.kind === "cancel") done(await cancelBooking(pane.booking.id, pane.reason));
      if (pane.kind === "room")
        done(
          await saveRoom({
            id: pane.id,
            name: pane.name,
            capacity: Number(pane.capacity),
            features: pane.features.split("\n").map((f) => f.trim()).filter(Boolean),
            description: pane.description,
            active: pane.active,
          }),
        );
    });
  }

  const blockSlots = pane?.kind === "block" ? slotsOfDay(pane.day) : [];

  // The day's summary.
  const memberBookings = bookings.filter((b) => b.kind === "member");
  const blocks = bookings.filter((b) => b.kind === "block");
  const memberMinutes = memberBookings.reduce((n, b) => n + b.minutes, 0);
  const byRoom = new Map<string, number>();
  for (const b of memberBookings) byRoom.set(b.roomName, (byRoom.get(b.roomName) ?? 0) + b.minutes);
  const busiest = [...byRoom.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const BLOCK_DAYS = Array.from({ length: 60 }, (_, i) => addDays(today, i));

  return (
    <div className="flex flex-col gap-6">
      {notice && (
        <p role={notice.ok ? "status" : "alert"} className="border border-dashed border-border px-4 py-3 text-sm text-graphite">
          {notice.text}
        </p>
      )}

      {/*
        THE WEEK STRIP — the date picker, Linear-style: seven days with each
        one's count, ‹ › for the week, Today. You see where the busy days
        are before you click. Weekends are listed (staff can block them)
        but read quieter: members can't book them.
      */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Its own full row on a phone; beside the buttons from sm up. */}
        <div className="flex w-full min-w-0 items-stretch sm:w-auto sm:flex-1">
          <Link href={`/portal/admin/rooms?day=${prevWeek}`} scroll={false} aria-label="Previous week" className="inline-flex w-9 shrink-0 items-center justify-center border border-border bg-bone-light hover:bg-bone">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.7} />
          </Link>
          <nav aria-label="Day" className="grid min-w-0 flex-1 grid-cols-7 border-y border-border bg-bone-light">
            {weekDays.map((w) => {
              const selected = w.day === day;
              const weekend = !isBookableWeekday(w.day);
              return (
                <Link
                  key={w.day}
                  href={`/portal/admin/rooms?day=${w.day}`}
                  scroll={false}
                  aria-current={selected ? "date" : undefined}
                  aria-label={`${dayLabel(w.day, "long")}: ${w.bookings} ${w.bookings === 1 ? "booking" : "bookings"}${w.blocks ? `, ${w.blocks} blocked` : ""}`}
                  className={cn(
                    "relative flex min-w-0 flex-col items-center justify-center border-r border-border px-1 py-1.5 last:border-r-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-clay",
                    selected ? "bg-graphite text-bone" : weekend ? "text-muted-foreground hover:bg-bone" : "text-graphite hover:bg-bone",
                    w.day === today && !selected && "shadow-[inset_0_-2px_0_var(--color-clay)]",
                  )}
                >
                  <span className={cn("text-[11px]", selected ? "text-bone/70" : "text-muted-foreground")}>
                    {w.day === today ? "Today" : dayLabel(w.day).split(",")[0]}
                  </span>
                  <span className="text-sm font-medium tabular-nums">{Number(w.day.slice(8))}</span>
                  <span className={cn("text-[11px] tabular-nums", selected ? "text-bone/80" : w.bookings ? "text-graphite" : "text-muted-foreground/60")}>
                    {w.bookings ? <><span className="sm:hidden">{w.bookings}</span><span className="hidden sm:inline">{w.bookings} booked</span></> : "\u00a0"}
                  </span>
                </Link>
              );
            })}
          </nav>
          <Link href={`/portal/admin/rooms?day=${nextWeek}`} scroll={false} aria-label="Next week" className="inline-flex w-9 shrink-0 items-center justify-center border border-border bg-bone-light hover:bg-bone">
            <ChevronRight className="h-4 w-4" strokeWidth={1.7} />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {day !== today && (
            <Link href="/portal/admin/rooms" scroll={false} className={buttonClass("outline", "sm", "border-border bg-bone-light")}>
              Today
            </Link>
          )}
          <Button variant="outline" size="sm" className="border-border bg-bone-light" onClick={() => show({ kind: "rooms" })} disabled={pending}>
            Rooms
          </Button>
          <Button variant="ink" size="sm" onClick={() => show(blank())} disabled={pending}>
            <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
            Block time
          </Button>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <div className="contents">
          {/* ── THE DAY'S SUMMARY — the numbers, then the reservations ── */}
          <section aria-labelledby="day-title">
            {/* The day, and its numbers in one line — four boxes repeated the table. */}
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 id="day-title" className="text-base font-medium text-graphite">
                {dayLabel(day, "long")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {memberBookings.length === 0
                  ? "No bookings"
                  : `${memberBookings.length} ${memberBookings.length === 1 ? "booking" : "bookings"} · ${lengthLabel(memberMinutes)}${busiest && byRoom.size > 1 ? ` · ${busiest} busiest` : ""}`}
                {blocks.length ? ` · ${blocks.length} blocked` : ""}
              </p>
            </div>

            {bookings.length === 0 ? (
              <p className="mt-4 border border-dashed border-border px-6 py-8 text-center text-sm text-muted-foreground">
                No reservations{isBookableWeekday(day) ? "" : " — members can't book weekends"}.
              </p>
            ) : (
              <Table className="mt-4">
                <thead>
                  <tr>
                    <Th className="w-48">Time</Th>
                    <Th className="w-28">Room</Th>
                    <Th>Booked by</Th>
                    <Th className="hidden w-[20%] md:table-cell">Note</Th>
                    <Th className="w-28" align="right">
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const ended = Date.parse(b.end) <= now;
                    const live = !ended && Date.parse(b.start) <= now;
                    return (
                      <Tr key={b.id} className={cn(ended && "text-muted-foreground")}>
                        <Td className={cn("tabular-nums", ended && "text-muted-foreground")}>
                          {timeLabel(b.start)} – {timeLabel(b.end)}
                        </Td>
                        <Td className={cn(ended && "text-muted-foreground")}>{b.roomName}</Td>
                        <Td className={cn(ended && "text-muted-foreground")}>
                          {b.kind === "block" ? (
                            <Status kind="blocked">Blocked by staff</Status>
                          ) : (
                            <>
                              {b.memberName} <span className="text-muted-foreground">· {lengthLabel(b.minutes)}</span>
                            </>
                          )}
                        </Td>
                        <Td className="hidden text-muted-foreground md:table-cell">{b.note || "—"}</Td>
                        <Td align="right">
                          {ended ? (
                            <span className="text-[13px] text-muted-foreground">Ended</span>
                          ) : (
                            <span className="inline-flex items-center gap-3">
                              {live && <Status kind="progress" className="text-[13px]">In use</Status>}
                              <button type="button" onClick={() => show({ kind: "cancel", booking: b, reason: "" })} className="text-sm text-graphite underline decoration-clay decoration-1 underline-offset-2">
                                {b.kind === "block" ? "Remove" : "Cancel"}
                              </button>
                            </span>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </section>

          {/* ── THE SCHEDULE — every room across the bookable window ── */}
          <section className="border border-border bg-bone-light">
            <h2 className="border-b border-border px-4 py-2.5 text-sm font-medium text-graphite">
              Schedule <span className="ml-1 font-normal text-muted-foreground">· {BOOKING_WINDOW.label}</span>
            </h2>
            <ul className="flex flex-col gap-4 p-4">
              {rooms.filter((r) => r.active).map((r) => (
                <li key={r.id}>
                  <p className="mb-1.5 flex items-baseline gap-2 text-sm">
                    <span className="font-medium text-graphite">{r.name}</span>
                    <span className="text-[13px] text-muted-foreground">up to {r.capacity}</span>
                  </p>
                  <RoomTimeline
                    tall
                    slots={slots}
                    now={now}
                    blocks={bookings
                      .filter((b) => b.roomId === r.id)
                      .map((b) => ({ id: b.id, start: b.start, end: b.end, tone: b.kind === "block" ? "block" : "member", label: b.kind === "block" ? b.note : (b.memberName ?? "Member") }))}
                  />
                </li>
              ))}
            </ul>
          </section>
        </div>

      </div>

      <Drawer
        open={open}
        onClose={close}
        title={pane?.kind === "rooms" ? "Rooms and rules" : pane?.kind === "block" ? "Block time" : pane?.kind === "cancel" ? (pane.booking.kind === "block" ? "Remove this block" : "Cancel this booking") : pane?.id ? `Edit ${pane.name || "room"}` : "Add a room"}
        description={
          pane?.kind === "cancel"
            ? `${pane.booking.roomName} · ${dayLabel(day)} · ${timeLabel(pane.booking.start)} – ${timeLabel(pane.booking.end)}`
            : pane?.kind === "block"
              ? "Hold a room for a Geekdom event or maintenance. Members can't book over it."
              : undefined
        }
        footer={
          pane?.kind === "rooms" ? (
            <Button type="button" variant="ghost" onClick={close}>
              Close
            </Button>
          ) : (
          <>
            <Button type="submit" form="rooms-form" variant="ink" disabled={pending}>
              {pending ? "Working…" : pane?.kind === "block" ? "Block it" : pane?.kind === "cancel" ? (pane.booking.kind === "block" ? "Remove block" : "Cancel and email them") : "Save"}
            </Button>
            <Button type="button" variant="ghost" onClick={close} disabled={pending}>
              {pane?.kind === "cancel" ? "Keep it" : "Cancel"}
            </Button>
          </>
          )
        }
      >
        {pane?.kind === "rooms" && (
        <div className="flex flex-col gap-6">
          <section className="border border-border bg-bone-light">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
              <h2 className="text-sm font-medium text-graphite">
                Rooms <span className="ml-1 tabular-nums text-muted-foreground">{rooms.length}</span>
              </h2>
              <Button variant="outline" size="sm" disabled={pending} onClick={() => show({ kind: "room", name: "", capacity: "10", features: "", description: "", active: true })}>
                <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
                Add
              </Button>
            </div>
            <ul>
              {rooms.map((r) => (
                <li key={r.id} className="group relative flex items-start gap-3 border-t border-border px-4 py-3 first:border-t-0 hover:bg-bone">
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => show({ kind: "room", id: r.id, name: r.name, capacity: String(r.capacity), features: r.features.join("\n"), description: r.description, active: r.active })}
                      className="text-left text-sm font-medium text-graphite after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-clay"
                    >
                      {r.name}
                    </button>
                    {!r.active && <Status kind="closed" className="ml-2 text-[13px] text-muted-foreground">Not bookable</Status>}
                    <p className="mt-0.5 flex items-center gap-1 text-[13px] text-muted-foreground">
                      <Users aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.7} /> Up to {r.capacity}
                    </p>
                    {r.features.length > 0 && <p className="mt-0.5 text-[13px] text-muted-foreground">{r.features.join(" · ")}</p>}
                  </div>
                  <Pencil aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" strokeWidth={1.7} />
                </li>
              ))}
            </ul>
          </section>

          <section className="border border-border bg-bone-light p-4">
            <h2 className={cn(ADMIN_LABEL, "mb-3 text-muted-foreground")}>The rules members book under</h2>
            <ul className="flex flex-col gap-1.5 text-sm text-graphite">
              <li>30-minute steps, {lengthLabel(ROOM_RULES.maxMinutes)} at most</li>
              <li>Up to {ROOM_RULES.daysAhead} days ahead</li>
              <li>{ROOM_RULES.weeklyMinutes / 60} hours per member per week (Sun–Sat)</li>
              <li>{BOOKING_WINDOW.daysLabel}, {BOOKING_WINDOW.label}, booked instantly — no approval</li>
            </ul>
            <p className="mt-3 text-[13px] text-muted-foreground">
              For a weekend, or outside {BOOKING_WINDOW.label}, members email the Club team: block the room for them here — blocks can go on any day at any hour and skip the 14-day and weekly limits. The schedule shows {BOOKING_WINDOW.label}; anything outside it is in the table. Members see free and booked time, never who booked.
            </p>
          </section>
        </div>
        )}
        {pane && pane.kind !== "rooms" && (
          <form id="rooms-form" onSubmit={submit} noValidate className="flex flex-col gap-5">
            {pane.kind === "block" && (
              <>
                <Field label="Room" htmlFor="bl-room">
                  <Combobox id="bl-room" name="room" options={rooms.map((r) => ({ value: r.id, label: r.name }))} value={pane.roomId} onChange={(v) => patch({ roomId: v })} searchable={false} />
                </Field>
                <Field label="Day" htmlFor="bl-day">
                  <Combobox
                    id="bl-day"
                    name="day"
                    options={BLOCK_DAYS.map((d) => ({ value: d, label: dayLabel(d, "long") }))}
                    value={pane.day}
                    onChange={(v) => {
                      const s = slotsOfDay(v);
                      const keep = s.find((x) => timeLabel(x) === timeLabel(pane.start)) ?? s[18];
                      patch({ day: v, start: keep });
                    }}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Starts" htmlFor="bl-start">
                    <Combobox id="bl-start" name="start" options={blockSlots.map((s) => ({ value: s, label: timeLabel(s) }))} value={pane.start} onChange={(v) => patch({ start: v })} />
                  </Field>
                  <Field label="For" htmlFor="bl-len">
                    <Combobox
                      id="bl-len"
                      name="length"
                      options={Array.from({ length: BLOCK_MAX_MINUTES / 30 }, (_, i) => (i + 1) * 30).map((m) => ({ value: String(m), label: lengthLabel(m) }))}
                      value={String(pane.minutes)}
                      onChange={(v) => patch({ minutes: Number(v) })}
                    />
                  </Field>
                </div>
                <Field label="What it's for" htmlFor="bl-note" error={errors.note} required hint="Staff see this on the schedule. Members only see the room as booked.">
                  <Input id="bl-note" value={pane.note} onChange={(e) => patch({ note: e.target.value })} placeholder="Geekdom event, maintenance…" data-autofocus />
                </Field>
              </>
            )}

            {pane.kind === "cancel" && (
              <>
                {pane.booking.kind === "member" ? (
                  <>
                    <p className="text-sm leading-relaxed text-graphite">
                      {pane.booking.memberName} ({pane.booking.memberEmail}) is emailed that the Geekdom team canceled it, and the hours go back to their week.
                    </p>
                    <Field label="Why (optional — included in the email)" htmlFor="cx-reason">
                      <Textarea id="cx-reason" rows={3} value={pane.reason} onChange={(e) => patch({ reason: e.target.value })} placeholder="We need the room for a Geekdom event that afternoon." />
                    </Field>
                  </>
                ) : (
                  <p className="text-sm text-graphite">The room becomes bookable again for that time. No one is emailed.</p>
                )}
              </>
            )}

            {pane.kind === "room" && (
              <>
                <Field label="Name" htmlFor="rm-name" error={errors.name} required>
                  <Input id="rm-name" value={pane.name} onChange={(e) => patch({ name: e.target.value })} data-autofocus />
                </Field>
                <Field label="Seats up to" htmlFor="rm-cap" error={errors.capacity} required>
                  <Input id="rm-cap" type="number" inputMode="numeric" min={1} value={pane.capacity} onChange={(e) => patch({ capacity: e.target.value })} className="w-32" />
                </Field>
                <Field label="What's in it" htmlFor="rm-feat" error={errors.features} hint="One per line — a 75-inch TV, a whiteboard, a video-call camera.">
                  <Textarea id="rm-feat" rows={4} value={pane.features} onChange={(e) => patch({ features: e.target.value })} />
                </Field>
                <Field label="One line about it" htmlFor="rm-desc" error={errors.description}>
                  <Input id="rm-desc" value={pane.description} onChange={(e) => patch({ description: e.target.value })} />
                </Field>
                <Switch checked={pane.active} onChange={(v) => patch({ active: v })} label="Members can book it" />
              </>
            )}

            {error && (
              <p role="alert" className="text-sm text-geekdom-red">
                {error}
              </p>
            )}
          </form>
        )}
      </Drawer>
    </div>
  );
}
