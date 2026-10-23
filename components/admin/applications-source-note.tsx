import { HEADING, MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";

/*
  FOR THE GEEKDOM TEAM — why this page is empty, and the choice it's waiting
  on. Written to them, in plain words: today applications go Typeform →
  Airtable; this page can show them, keep them current, and let the team
  review, approve and invite from one place. Shown until applications start
  arriving here.
*/
export function ApplicationsSourceNote() {
  return (
    <section className="border border-graphite bg-bone-light">
      <div className="border-b border-border px-6 py-5 sm:px-8">
        <p className={cn(MONO.label, "text-muted-foreground")}>For the Geekdom team</p>
        <h2 className={cn(HEADING.subhead, "mt-2 text-graphite")}>
          Applications can live here, in the same place as your members.
        </h2>
      </div>
      <div className="grid gap-8 px-6 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 leading-relaxed text-graphite">
          <p>
            <span className="font-medium">Today:</span> people apply through your Typeform
            on /apply, and Typeform saves each application to Airtable. That keeps working
            exactly as it does now — nothing on this page has changed it.
          </p>
          <p>
            <span className="font-medium">What this page can do:</span> show every application
            the moment it&rsquo;s submitted, let you mark it reviewing, approved, declined or
            waitlisted, keep notes, and — when you approve someone — send their welcome
            email and payment link from here. Approved applicants become members on the
            Members page automatically once they pay. Applications, members and billing on one
            platform, always current.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <p className={cn(MONO.micro, "text-muted-foreground")}>Two ways to connect it</p>
          <div className="border-l-2 border-clay pl-4">
            <p className="font-medium text-graphite">1. Point Typeform at the website (recommended)</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Typeform can send each new application to this site as well as to Airtable, so
              Airtable keeps getting everything and nothing breaks. New applications appear
              here instantly. Needs: someone with admin access to the Typeform account to
              add the website as a destination (a webhook) — about ten minutes.
            </p>
          </div>
          <div className="border-l-2 border-border pl-4">
            <p className="font-medium text-graphite">2. Read from Airtable</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Airtable stays the place you work, and this page shows what&rsquo;s there. Simpler
              to switch on, but reviewing and approving would still happen in Airtable, and
              this page would be a copy. Needs: an Airtable access token for the base.
            </p>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Either way, applications already in Airtable can be brought in once, so the history
            is here too. Tell Jesse which you&rsquo;d like, and it can be connected.
          </p>
        </div>
      </div>
    </section>
  );
}
