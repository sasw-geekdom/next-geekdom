import { bookingsBetween, listRooms } from "@/lib/rooms/rooms";
import { addDays, centralDay, dayStartIso, isDay, weekKey, windowSlots } from "@/lib/rooms/rules";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { RoomsManager } from "@/components/admin/rooms-manager";

export const metadata = { title: "Rooms" };

/*
  ROOMS — the admin side of Phase 4, laid out like a work tool: a week
  strip to pick the day (each day's count on it), the day's summary and
  its reservations at the TOP — what staff open the page to see — then
  the room-by-room schedule, with the rooms and rules beside it. Any day,
  past or future; one query for the whole week.
*/
export default async function AdminRoomsPage(props: PageProps<"/portal/admin/rooms">) {
  const { day: raw, block } = await props.searchParams;
  const now = new Date().getTime();
  const today = centralDay(new Date(now));
  const day = isDay(raw) ? raw : today;
  // The week the day sits in (Sunday to Saturday, the cap's week), read once.
  const weekStart = weekKey(`${day}T18:00:00.000Z`);
  const [{ rooms, saved }, week] = await Promise.all([listRooms(), bookingsBetween(weekStart, addDays(weekStart, 7))]);
  const touches = (b: { start: string; end: string }, d: string) =>
    Date.parse(b.start) < Date.parse(dayStartIso(addDays(d, 1))) && Date.parse(b.end) > Date.parse(dayStartIso(d));
  const bookings = week.filter((b) => touches(b, day));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((d) => ({
    day: d,
    bookings: week.filter((b) => b.kind === "member" && touches(b, d)).length,
    blocks: week.filter((b) => b.kind === "block" && touches(b, d)).length,
  }));

  return (
    <>
      <PageHeader
        title="Rooms"
        description={`Conference-room bookings, day by day${saved ? "" : " · the rooms are placeholders until you edit one"}`}
      />
      <AdminSection>
        <RoomsManager
          now={now}
          today={today}
          day={day}
          weekDays={weekDays}
          prevWeek={addDays(weekStart, -7)}
          nextWeek={addDays(weekStart, 7)}
          slots={windowSlots(day)}
          rooms={rooms}
          bookings={bookings}
          startBlocking={block === "1"}
        />
      </AdminSection>
    </>
  );
}
