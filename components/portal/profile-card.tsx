"use client";

import * as React from "react";
import { Globe, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";
import { ProfileEditor, type ProfileDraft } from "@/components/portal/profile-editor";

/*
  THE DIRECTORY PROFILE, AS A CARD — borrowed from next-angels' profile page.

  The page used to hold the whole ten-field form inline, which is most of
  why the profile scrolled forever. Now the page shows the profile the way
  other members see it — portrait, name, role, headline, "Ask me about",
  links, listed or not — and EDIT opens the form in the slide-out. The card
  is the preview; after saving it shows the change.

  Saving stores it (saveMyProfile) for a member; a staff account sees a
  preview it can't store. Photos aren't stored yet — initials stand in.
*/

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

export function ProfileCard({
  initial,
  save,
}: {
  initial: ProfileDraft;
  /** Stores the profile (a member's own). Absent = a design preview (staff). */
  save?: (d: ProfileDraft) => Promise<{ ok: boolean; message: string }>;
}) {
  const [profile, setProfile] = React.useState(initial);
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(null);
  const [open, setOpen] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  // A fresh editor each time the drawer opens, starting from the card.
  const [editorKey, setEditorKey] = React.useState(0);
  const edit = () => {
    setEditorKey((k) => k + 1);
    setSaved(false);
    setOpen(true);
  };

  /*
    WHAT'S MISSING, as a nudge — members find each other by these, and an
    imported profile often has only a name and a headline. Each opens the
    editor. Shown only while something's missing, and only to the member.
  */
  const missing = [
    !profile.headline && "a headline",
    !profile.role && "your role",
    profile.askMeAbout.length === 0 && "what to ask you about",
    !profile.bio && "a short bio",
  ].filter((x): x is string => Boolean(x));

  return (
    <section className="flex flex-col border border-border bg-bone-light p-6 sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <h2 className={cn(MONO.label, "text-muted-foreground")}>Directory profile</h2>
        <Button variant="ink" size="sm" onClick={edit}>
          <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
          Edit
        </Button>
      </div>

      <div className={cn("mt-5 flex items-center gap-4", !profile.listed && "opacity-50")}>
        {profile.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.photo} alt="" className="h-14 w-14 shrink-0 border border-border bg-bone object-cover" />
        ) : (
          <span aria-hidden="true" className={cn(MONO.label, "flex h-14 w-14 shrink-0 items-center justify-center bg-graphite text-bone")}>
            {initials(profile.name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium text-graphite">{profile.name || "Your name"}</p>
          <p className="truncate text-sm text-muted-foreground">
            {profile.role || "Role"}
            {profile.company ? ` · ${profile.company}` : ""}
          </p>
        </div>
      </div>
      <p className={cn("mt-4 leading-relaxed text-graphite", !profile.listed && "opacity-50")}>
        {profile.headline || "Add a headline — one line on what you're building."}
      </p>
      {profile.askMeAbout.length > 0 && (
        <div className={cn("mt-4 flex flex-wrap gap-1.5", !profile.listed && "opacity-50")}>
          {profile.askMeAbout.map((t) => (
            <span key={t} className="border border-border bg-bone px-2 py-0.5 text-xs text-graphite">{t}</span>
          ))}
        </div>
      )}

      {missing.length > 0 && (
        <div className="mt-6 border border-dashed border-border px-4 py-3">
          <p className="text-sm text-graphite">Complete your profile — members find each other by what&rsquo;s here.</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Add{" "}
            {missing.map((m, i) => (
              <React.Fragment key={m}>
                {i > 0 && (i === missing.length - 1 ? " and " : ", ")}
                <button type="button" onClick={edit} className="text-graphite underline decoration-clay decoration-1 underline-offset-2">
                  {m}
                </button>
              </React.Fragment>
            ))}
            .
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">
          {profile.listed
            ? "Listed — other members can find you in the directory."
            : "Not listed — you're hidden from the directory."}
        </p>
        {(profile.linkedin || profile.website) && (
          <div className="flex gap-2">
            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noreferrer noopener" aria-label="Your LinkedIn (opens in a new tab)" className="inline-flex h-8 w-8 items-center justify-center border border-border bg-bone hover:border-graphite">
                {/* LinkedIn's official [in] logo, black, unaltered — public/brand/third-party/README.md */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/third-party/linkedin-in-black.png" alt="" width={17} height={16} className="h-4 w-auto" />
              </a>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noreferrer noopener" aria-label="Your website (opens in a new tab)" className="inline-flex h-8 w-8 items-center justify-center border border-border bg-bone text-graphite hover:border-graphite">
                <Globe className="h-4 w-4" strokeWidth={1.6} />
              </a>
            )}
          </div>
        )}
      </div>
      {saved && !save && (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          Preview only — staff accounts have no profile to store.
        </p>
      )}
      {result && (
        <p role={result.ok ? "status" : "alert"} className={cn("mt-3 text-sm", result.ok ? "text-muted-foreground" : "text-geekdom-red")}>
          {result.message}
        </p>
      )}

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Directory profile"
        title="Edit your profile"
        footer={
          <>
            <Button type="submit" form="profile-form" variant="ink">
              Save profile
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <ProfileEditor
          key={editorKey}
          initial={profile}
          formId="profile-form"
          onSave={async (d) => {
            setProfile(d);
            setSaved(true);
            setOpen(false);
            setResult(null);
            if (save) setResult(await save(d));
          }}
        />
      </Drawer>
    </section>
  );
}
