import "server-only";

import {
  applicationApprovedEmail,
  applicationDeclinedEmail,
  applicationReceivedEmail,
  newApplicationEmail,
  paymentLinkEmail,
  teamReviewEmail,
} from "@/lib/email/application-templates";
import { inquiryAcceptedEmail, inquiryDeclinedEmail, inquiryReceivedEmail, inquiryStaffEmail } from "@/lib/email/inquiry-templates";
import {
  adminAccessEmail,
  cancellationConfirmedEmail,
  compEndingEmail,
  introRequestEmail,
  memberWelcomeEmail,
  membershipActiveAgainEmail,
  membershipEndedEmail,
  membershipPausedEmail,
  paymentFailedEmail,
  portalInviteEmail,
  receiptEmail,
  invoiceEmail,
  signInLinkEmail,
  teamInviteEmail,
  teamRemovedEmail,
  teammateBackEmail,
  teammateContinuesEmail,
  teammateEndedEmail,
  teammateEndingEmail,
  teammatePausedEmail,
  url,
  welcomeBackEmail,
  type Email,
} from "@/lib/email/member-templates";
import { bookingCanceledByStaffEmail, bookingConfirmedEmail, bookingTodayEmail } from "@/lib/email/room-templates";
import { priceLabel } from "@/lib/membership";
import { addDays, centralDay } from "@/lib/rooms/rules";
import { fromCentral } from "@/lib/content/dates";

/*
  EVERY AUTOMATED EMAIL, FOR STAFF TO SEE (Jesse, November 2026 — Settings →
  Emails). Built from the real templates with sample data, so what staff see
  is exactly what goes out through Resend. Only emails the app actually sends
  are listed (two unused templates — email changed, card expiring — aren't).
  A new automated email gets an entry here: what it is, who gets it, and
  when, in plain words.
*/

export interface CatalogEntry {
  key: string;
  group: string;
  title: string;
  /** Who receives it. */
  to: string;
  /** When it goes out, in plain words. */
  when: string;
  build: () => Email;
}

const NAME = "Dana Ruiz";
const AMOUNT = priceLabel()?.split("/")[0] ?? "$100";
const CHECKOUT = "https://checkout.stripe.com/c/pay/sample";
const day = (n: number) => new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "long", day: "numeric", year: "numeric" }).format(new Date(Date.now() + n * 86_400_000));
const today = centralDay(new Date());
// A time on a Central day, right in winter and summer alike.
const at = (d: string, hh: number) => {
  const [y, m, dd] = d.split("-");
  return fromCentral(y, m, dd, `${String(hh).padStart(2, "0")}:00`) ?? `${d}T${hh + 6}:00:00.000Z`;
};
const tomorrow = addDays(today, 1);
const applicant = {
  id: "sample",
  name: NAME,
  email: "dana@example.com",
  plan: "solo" as const,
  city: "San Antonio",
  describes: ["Founder of a startup that's generating revenue"],
  brag: "I built a scheduling tool that 40 clinics in South Texas use every day.",
  building: "Scheduling software for small clinics — online booking, reminders and waitlists.",
};
const company = { name: NAME, company: "Acme Co." };

export const EMAIL_GROUPS = ["Applications", "Event and Studio requests", "Signing in and access", "Membership", "Payments", "Cancelling", "Teams", "Rooms", "The directory"] as const;

export const CATALOG: CatalogEntry[] = [
  // ── Applications ──
  { key: "application-received", group: "Applications", title: "We have your application", to: "The applicant", when: "Someone submits an application on the website.", build: () => applicationReceivedEmail({ name: NAME, plan: "solo" }) },
  { key: "application-new-staff", group: "Applications", title: "New application (to staff)", to: "The research team", when: "A new application arrives, so research can start.", build: () => newApplicationEmail(applicant) },
  { key: "application-team-review", group: "Applications", title: "Ready for the team (to staff)", to: "The team", when: "Research is written up and sent to the team.", build: () => teamReviewEmail({ ...applicant, by: "Monica", recommendation: "approve" }) },
  { key: "application-approved", group: "Applications", title: "Approved — with the payment link", to: "The applicant", when: "The team approves a Solo or Team application. They become a member once they pay.", build: () => applicationApprovedEmail({ name: NAME, plan: "solo", checkoutUrl: CHECKOUT }) },
  { key: "application-approved-enterprise", group: "Applications", title: "Approved — Enterprise", to: "The applicant", when: "The team approves an Enterprise application. They're a member right away and can sign in.", build: () => applicationApprovedEmail({ name: NAME, plan: "enterprise", checkoutUrl: null }) },
  { key: "payment-link", group: "Applications", title: "Your payment link", to: "The applicant", when: "Staff send (or resend) the payment link to someone approved who hasn't paid yet.", build: () => paymentLinkEmail({ name: NAME, plan: "solo", checkoutUrl: CHECKOUT }) },
  { key: "application-declined", group: "Applications", title: "Not this time", to: "The applicant", when: "An application is declined — at research or by the team.", build: () => applicationDeclinedEmail({ name: NAME }) },

  // ── Requests ──
  { key: "event-request-received", group: "Event and Studio requests", title: "We have your event request", to: "The company asking", when: "A company asks to host an event, from the Club page.", build: () => inquiryReceivedEmail("event", company) },
  { key: "event-request-staff", group: "Event and Studio requests", title: "New event request (to staff)", to: "The events team", when: "An event request arrives.", build: () => inquiryStaffEmail("event", "sample", { ...company, email: "dana@acme.co", eventType: "Offsite / planning day", headcount: "About 30", when: "Early December", details: "A planning day for our leadership team." }) },
  { key: "event-request-accepted", group: "Event and Studio requests", title: "Let's plan it", to: "The company asking", when: "Staff accept an event request.", build: () => inquiryAcceptedEmail("event", company) },
  { key: "event-request-declined", group: "Event and Studio requests", title: "Event request — not this time", to: "The company asking", when: "Staff decline an event request.", build: () => inquiryDeclinedEmail("event", company) },
  { key: "partner-request-received", group: "Event and Studio requests", title: "We have your Studio inquiry", to: "The company asking", when: "A company gets in touch about partnering with the Studio.", build: () => inquiryReceivedEmail("partner", company) },
  { key: "partner-request-staff", group: "Event and Studio requests", title: "New Studio inquiry (to staff)", to: "The Studio team", when: "A Studio partner inquiry arrives.", build: () => inquiryStaffEmail("partner", "sample", { ...company, email: "dana@acme.co", interest: "Corporate partnership", details: "We'd like to sponsor founders in health tech." }) },

  // ── Signing in and access ──
  { key: "sign-in-link", group: "Signing in and access", title: "Your sign-in link", to: "A member or staff", when: "Someone asks for a sign-in link. There are no passwords.", build: () => signInLinkEmail({ link: url("/sign-in") }) },
  { key: "portal-invite", group: "Signing in and access", title: "Your member portal is open", to: "Members", when: "Staff send the launch invitations, in waves. Locked until launch.", build: () => portalInviteEmail({ name: NAME }) },
  { key: "admin-access", group: "Signing in and access", title: "You have access to the Geekdom admin", to: "A new admin", when: "Management gives someone admin access.", build: () => adminAccessEmail({ name: NAME, by: "Brooke Rodriguez", role: "Staff" }) },

  // ── Membership ──
  { key: "member-welcome", group: "Membership", title: "Welcome to Geekdom", to: "A new member", when: "Their first payment goes through, and they become a member.", build: () => memberWelcomeEmail({ name: NAME }) },
  { key: "membership-paused", group: "Membership", title: "Your membership is paused", to: "The member", when: "Staff pause a membership (staff can choose not to send it).", build: () => membershipPausedEmail({ name: NAME }) },
  { key: "membership-active-again", group: "Membership", title: "Your membership is active again", to: "The member", when: "Staff reactivate a paused or ended membership (staff can choose not to send it).", build: () => membershipActiveAgainEmail({ name: NAME }) },

  // ── Payments ──
  { key: "invoice", group: "Payments", title: "An invoice to pay", to: "The member (or their team's owner)", when: "Management sends a one-off invoice to pay in the portal — a company event in the space.", build: () => invoiceEmail({ name: NAME, total: "$1,200", lines: [["Event space · December 12", "$1,000"], ["A/V and setup", "$200"]], due: day(7), number: "GKDM-0012" }) },
  { key: "receipt", group: "Payments", title: "Your receipt", to: "The member", when: "Each monthly payment goes through.", build: () => receiptEmail({ name: NAME, amount: AMOUNT, date: day(0), card: "Visa •••• 4242", invoiceNumber: "GKDM-0007" }) },
  { key: "payment-failed", group: "Payments", title: "Your payment didn't go through", to: "The member", when: "A monthly payment fails. They keep access while they fix it.", build: () => paymentFailedEmail({ name: NAME, amount: AMOUNT, card: "Visa •••• 4242" }) },
  { key: "comp-ending", group: "Payments", title: "Your complimentary membership ends soon", to: "The member", when: "30 days before a complimentary period (e.g. DEVSA community) ends.", build: () => compEndingEmail({ name: NAME, label: "DEVSA community", endDate: day(30), resumes: { amount: AMOUNT, card: "Visa •••• 4242" } }) },

  // ── Cancelling ──
  { key: "cancellation-confirmed", group: "Cancelling", title: "Your membership is set to end", to: "The member", when: "A member cancels (or Management cancels for them) at the end of the paid month.", build: () => cancellationConfirmedEmail({ name: NAME, endDate: day(29) }) },
  { key: "welcome-back", group: "Cancelling", title: "Your membership continues", to: "The member", when: "They change their mind before their last day.", build: () => welcomeBackEmail({ name: NAME, nextPayment: day(29) }) },
  { key: "membership-ended", group: "Cancelling", title: "Your membership has ended", to: "The member", when: "Their membership ends — at the end of a cancelled month, or when staff cancel it.", build: () => membershipEndedEmail({ name: NAME }) },

  // ── Teams ──
  { key: "team-invite", group: "Teams", title: "You're on a team membership", to: "A teammate", when: "A team owner (or staff) adds someone to their team.", build: () => teamInviteEmail({ name: NAME, ownerName: "Alex Kim", company: "Acme Co." }) },
  { key: "team-removed", group: "Teams", title: "Your team access has ended", to: "A teammate", when: "Someone is taken off a team.", build: () => teamRemovedEmail({ name: NAME, company: "Acme Co." }) },
  { key: "teammate-ending", group: "Teams", title: "Your access ends on a date", to: "Every teammate", when: "The team's owner cancels at the end of the paid month.", build: () => teammateEndingEmail({ name: NAME, team: "Acme Co.", endDate: day(29) }) },
  { key: "teammate-continues", group: "Teams", title: "Your access continues", to: "Every teammate", when: "The owner changes their mind before the last day.", build: () => teammateContinuesEmail({ name: NAME, team: "Acme Co." }) },
  { key: "teammate-ended", group: "Teams", title: "Your access has ended", to: "Every teammate", when: "The team's membership ends.", build: () => teammateEndedEmail({ name: NAME, team: "Acme Co." }) },
  { key: "teammate-paused", group: "Teams", title: "Your access is paused", to: "Every teammate", when: "Staff pause the team's membership.", build: () => teammatePausedEmail({ name: NAME, team: "Acme Co." }) },
  { key: "teammate-back", group: "Teams", title: "Your access is back", to: "Every teammate", when: "Staff reactivate the team's membership.", build: () => teammateBackEmail({ name: NAME, team: "Acme Co." }) },

  // ── Rooms ──
  { key: "booking-confirmed", group: "Rooms", title: "Booked: a conference room", to: "The member", when: "A member books a room.", build: () => bookingConfirmedEmail({ name: NAME, room: "Cranberry", day: tomorrow, start: at(tomorrow, 10), end: at(tomorrow, 11), minutes: 60 }) },
  { key: "booking-today", group: "Rooms", title: "Today: your room", to: "The member", when: "Each morning, to members with a booking that day.", build: () => bookingTodayEmail({ name: NAME, bookings: [{ room: "Cranberry", start: at(today, 10), end: at(today, 11) }] }) },
  { key: "booking-canceled-by-staff", group: "Rooms", title: "Your booking was cancelled", to: "The member", when: "Staff cancel a member's booking (with an optional reason).", build: () => bookingCanceledByStaffEmail({ name: NAME, room: "Cranberry", day: tomorrow, start: at(tomorrow, 10), end: at(tomorrow, 11), minutes: 60, reason: "The room is needed for a Geekdom event." }) },

  // ── Directory ──
  { key: "intro-request", group: "The directory", title: "Someone would like to meet you", to: "A member", when: "Another member asks them for an intro from the directory. Replying goes straight to the person asking.", build: () => introRequestEmail({ toName: NAME, fromName: "Alex Kim", fromHeadline: "Building a fintech for small businesses", fromTopics: ["Fundraising", "B2B sales"], note: "I saw you've sold into clinics — I'm about to start that process and would love 20 minutes of your time.", profileUrl: url("/portal/directory") }) },
];
