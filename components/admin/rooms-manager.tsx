"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Pencil, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { Drawer } from "@/components/ui/drawer";
import { RoomTimeline } from "@/components/rooms/room-timeline";
import { ADMIN_LABEL, Status, Table, Td, Th, Tr } from "@/components/admin/admin-ui";
import { cn } from "@/lib/utils";
import { blockRoom, cancelBooking, saveRoom } from "@/lib/rooms/actions";
import { BLOCK_MAX_MINUTES, BOOKING_WINDOW, ROOM_RULES, addDays, dayLabel, lengthLabel, slotsOfDay, timeLabel } from "@/lib/rooms/rules";
import type { Booking, Room } from "@/lib/rooms/rooms";

/*
  THE ROOMS ADMIN. One day at a time (‹ › and Today, in the address so a
  day can be shared): the schedule across every room with who has each
  booking, the same bookings as a table to cancel from, and — beside it —
  the rooms and the rules. Three slide-outs: block time, cancel (with a
  reason the member is emailed), and edit a room.
*/

type Pane =
  | { kind: "block"; roomId: string; day: string; start: string; minutes: number; note: string }
  | { kind: "cancel"; booking: Booking; reason: string }
  | { kind: "room"; id?: string; name: string; capacity: string; features: string; description: string; active: boolean };

export function RoomsManager({
  now,
  today,
  day,
  prevDay,
  nextDay,
  slots,
  rooms,
  bookings,
  startBlocking = false,
}: {
  now: number;
  today: string;
  day: string;
  prevDay: string;
  nextDay: string;
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
  const BLOCK_DAYS = Array.from({ length: 60 }, (_, i) => addDays(today, i));

  return (
    <div className="flex flex-col gap-6">
      {notice && (
        <p role={notice.ok ? "status" : "alert"} className="border border-dashed border-border px-4 py-3 text-sm text-graphite">
          {notice.text}
        </p>
      )}

      {/* The day */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`/portal/admin/rooms?day=${prevDay}`} scroll={false} aria-label="Previous day" className="inline-flex h-8 w-8 items-center justify-center border border-border bg-bone-light hover:bg-bone">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.7} />
          </Link>
          <Link href={`/portal/admin/rooms?day=${nextDay}`} scroll={false} aria-label="Next day" className="-ml-px inline-flex h-8 w-8 items-center justify-center border border-border bg-bone-light hover:bg-bone">
            <ChevronRight className="h-4 w-4" strokeWidth={1.7} />
          </Link>
          <h2 className="ml-2 text-base font-medium text-graphite">{dayLabel(day, "long")}</h2>
          {day !== today && (
            <Link href="/portal/admin/rooms" scroll={false} className="ml-1 text-sm text-muted-foreground underline decoration-border underline-offset-2 hover:text-graphite">
              Today
            </Link>
          )}
        </div>
        <Button variant="ink" size="sm" onClick={() => show(blank())} disabled={pending}>
          <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
          Block time
        </Button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* The schedule */}
          <section className="border border-border bg-bone-light p-4">
            <ul className="flex flex-col gap-4">
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

          {/* The same day as a table */}
          {bookings.length === 0 ? (
            <p className="border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">No bookings on this day.</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th className="w-40">Time</Th>
                  <Th className="w-28">Room</Th>
                  <Th>Booked by</Th>
                  <Th className="hidden w-[26%] md:table-cell">Note</Th>
                  <Th className="w-24" align="right">
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const ended = Date.parse(b.end) <= now;
                  return (
                    <Tr key={b.id} className={cn(ended && "text-muted-foreground")}>
                      <Td className="tabular-nums">
                        {timeLabel(b.start)} – {timeLabel(b.end)}
                      </Td>
                      <Td>{b.roomName}</Td>
                      <Td>
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
                          <button type="button" onClick={() => show({ kind: "cancel", booking: b, reason: "" })} className="text-sm text-graphite underline decoration-clay decoration-1 underline-offset-2">
                            {b.kind === "block" ? "Remove" : "Cancel"}
                          </button>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </div>

        {/* The rooms and the rules */}
        <aside className="flex flex-col gap-6">
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
        </aside>
      </div>

      <Drawer
        open={open}
        onClose={close}
        title={pane?.kind === "block" ? "Block time" : pane?.kind === "cancel" ? (pane.booking.kind === "block" ? "Remove this block" : "Cancel this booking") : pane?.id ? `Edit ${pane.name || "room"}` : "Add a room"}
        description={
          pane?.kind === "cancel"
            ? `${pane.booking.roomName} · ${dayLabel(day)} · ${timeLabel(pane.booking.start)} – ${timeLabel(pane.booking.end)}`
            : pane?.kind === "block"
              ? "Hold a room for a Geekdom event or maintenance. Members can't book over it."
              : undefined
        }
        footer={
          <>
            <Button type="submit" form="rooms-form" variant="ink" disabled={pending}>
              {pending ? "Working…" : pane?.kind === "block" ? "Block it" : pane?.kind === "cancel" ? (pane.booking.kind === "block" ? "Remove block" : "Cancel and email them") : "Save"}
            </Button>
            <Button type="button" variant="ghost" onClick={close} disabled={pending}>
              {pane?.kind === "cancel" ? "Keep it" : "Cancel"}
            </Button>
          </>
        }
      >
        {pane && (
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
