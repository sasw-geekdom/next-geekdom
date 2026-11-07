import { requireMember } from "@/lib/auth/session";
import { bookerFor, bookingsForDay, listRooms, upcomingFor, weekUsage, weeksOf } from "@/lib/rooms/rooms";
import { bookableDays, isDay, weekKey, windowSlots } from "@/lib/rooms/rules";
import { PortalPage } from "@/components/portal/portal-page";
import { RoomBooker } from "@/components/portal/room-booker";

export const metadata = { title: "Book a room" };

/*
  BOOK A ROOM — the member side of Phase 4. Pick a day (today and the 13
  after it), see every room's day at a glance, book a free time in one
  slide-out. Your bookings and your hours left this week sit beside it.

  Other members' bookings read "Booked", never who — the strip is shared,
  the names aren't. Rules: lib/rooms/rules.ts; enforced in lib/rooms/actions.ts.
*/
export default async function RoomsPage(props: PageProps<"/portal/rooms">) {
  const user = await requireMember();
  const { day: raw } = await props.searchParams;
  // Server time, once, for every "is it past" decision on the page.
  const now = new Date().getTime();
  const days = bookableDays(new Date(now));
  const day = isDay(raw) && days.includes(raw) ? raw : days[0];

  // A current member, or staff booking as themselves.
  const [member, { rooms }, bookings] = await Promise.all([bookerFor(user), listRooms(), bookingsForDay(day)]);
  const [upcoming, usage] = member
    ? await Promise.all([upcomingFor(member.id, now), weekUsage(member.id, weeksOf(days))])
    : [[], {} as Record<string, number>];

  return (
    <PortalPage eyebrow="Rooms" title="Book a room.">
      <RoomBooker
        canBook={Boolean(member)}
        now={now}
        days={days}
        day={day}
        slots={windowSlots(day)}
        rooms={rooms.filter((r) => r.active).map(({ id, name, capacity, features, description }) => ({ id, name, capacity, features, description }))}
        // Who booked stays private: only "mine" or not.
        taken={bookings.map((b) => ({ id: b.id, roomId: b.roomId, start: b.start, end: b.end, mine: Boolean(member && b.memberId === member.id) }))}
        upcoming={upcoming.map((b) => ({ id: b.id, roomName: b.roomName, start: b.start, end: b.end, minutes: b.minutes }))}
        usage={usage}
        thisWeek={weekKey(new Date(now).toISOString())}
      />
    </PortalPage>
  );
}
