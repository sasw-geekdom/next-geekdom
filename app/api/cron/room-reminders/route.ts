import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type BookingDoc } from "@/lib/firebase/collections";
import { env } from "@/lib/env";
import { sendSafely } from "@/lib/email/resend";
import { bookingTodayEmail } from "@/lib/email/room-templates";
import { addDays, centralDay, dayStartIso } from "@/lib/rooms/rules";

/*
  THE MORNING-OF ROOM REMINDER — a daily scheduled job (vercel.json
  `crons`, 13:00 UTC: 7 AM Central in winter, 8 AM in summer — Vercel's
  schedule is UTC). Each member with a booking TODAY gets ONE email listing
  them (`bookingTodayEmail`), and each booking is marked `remindedAt` so a
  rerun sends nothing twice. Members' bookings only (not staff blocks), not
  canceled. A booking made after the run is one they just made — no
  reminder needed.

  Vercel calls it with `Authorization: Bearer $CRON_SECRET`; without the
  secret it refuses (fails closed). One range query on `start`, no index.
*/

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = env(process.env.CRON_SECRET);
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const today = centralDay(new Date());
  const from = new Date(dayStartIso(today));
  const to = new Date(dayStartIso(addDays(today, 1)));
  const snap = await getAdminDb()
    .collection(COLLECTIONS.bookings)
    .where("start", ">=", Timestamp.fromDate(from))
    .where("start", "<", Timestamp.fromDate(to))
    .get();

  // One email per member, with all of today's bookings in it.
  const byMember = new Map<string, { name: string; email: string; docs: FirebaseFirestore.QueryDocumentSnapshot[] }>();
  for (const d of snap.docs) {
    const b = d.data() as BookingDoc;
    if (b.kind !== "member" || b.status !== "booked" || b.remindedAt || !b.memberEmail || !b.memberId) continue;
    const entry = byMember.get(b.memberId) ?? { name: b.memberName ?? "", email: b.memberEmail, docs: [] };
    entry.docs.push(d);
    byMember.set(b.memberId, entry);
  }

  let sent = 0;
  for (const m of byMember.values()) {
    const bookings = m.docs
      .map((d) => d.data() as BookingDoc)
      .sort((a, b) => a.start.toMillis() - b.start.toMillis())
      .map((b) => ({ room: b.roomName, start: b.start.toDate().toISOString(), end: b.end.toDate().toISOString() }));
    const mail = bookingTodayEmail({ name: m.name, bookings });
    if (await sendSafely({ to: m.email, subject: mail.subject, html: mail.html, text: mail.text })) {
      const batch = getAdminDb().batch();
      for (const d of m.docs) batch.update(d.ref, { remindedAt: Timestamp.now() });
      await batch.commit();
      sent++;
    }
  }
  return NextResponse.json({ day: today, bookings: snap.size, members: byMember.size, sent });
}
