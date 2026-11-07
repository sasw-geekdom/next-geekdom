import { listRooms, bookingsForDay } from "@/lib/rooms/rooms";
import { addDays, centralDay, isDay, windowSlots } from "@/lib/rooms/rules";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { RoomsManager } from "@/components/admin/rooms-manager";

export const metadata = { title: "Rooms" };

/*
  ROOMS — the admin side of Phase 4: one day's schedule across every room
  (with who has each booking — members never see that), the day's bookings
  as a table staff can cancel from, staff blocks, and the rooms themselves
  (placeholders until Geekdom names them). Any day, past or future.
*/
export default async function AdminRoomsPage(props: PageProps<"/portal/admin/rooms">) {
  const { day: raw, block } = await props.searchParams;
  const now = new Date().getTime();
  const today = centralDay(new Date(now));
  const day = isDay(raw) ? raw : today;
  const [{ rooms, saved }, bookings] = await Promise.all([listRooms(), bookingsForDay(day)]);
  const memberBookings = bookings.filter((b) => b.kind === "member");

  return (
    <>
      <PageHeader
        title="Rooms"
        description={`${memberBookings.length} ${memberBookings.length === 1 ? "booking" : "bookings"} on this day${saved ? "" : " · rooms are placeholders until you edit one"}`}
      />
      <AdminSection>
        <RoomsManager
          now={now}
          today={today}
          day={day}
          prevDay={addDays(day, -1)}
          nextDay={addDays(day, 1)}
          slots={windowSlots(day)}
          rooms={rooms}
          bookings={bookings}
          startBlocking={block === "1"}
        />
      </AdminSection>
    </>
  );
}
