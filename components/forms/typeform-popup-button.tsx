"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { ARROW, LINK_ARROW } from "@/components/site/section";
import { TypeformMock } from "@/components/forms/typeform-mock";
import { ON_LIVE_DOMAIN } from "@/lib/preview";
import type { MockForm } from "@/data/mock/forms";

declare global {
  interface Window {
    /** Typeform's embed library. `load()` wires up any `data-tf-*` element not yet set up. */
    tf?: { load: () => void; reload: () => void };
    [callback: `geekdomTf${string}`]: (() => void) | undefined;
  }
}

/**
 * OUR control, in the site's design, that opens one of Geekdom's Typeforms as
 * a full-screen popup over the page. /apply's "Start application" is the
 * original; the Club page's "Host an event" and the Studio's partner ask use
 * the same mechanism with their own forms.
 *
 * WHY A POPUP, NOT THE INLINE EMBED. The inline frame put Typeform's own
 * styling — near-white ground, Inter, a rounded button, a second heading — in
 * the middle of a Bone page. Now the page stays on-brand until the visitor
 * commits, and the form gets the whole screen when they do.
 *
 * HOW IT'S WIRED, all verified against Typeform's embed.js:
 *
 *   · A REAL LINK UNDERNEATH. `href` is the form itself, so before the script
 *     loads — or if it's blocked — the control still works; it just leaves
 *     the site. Once the script is ready, the click opens the popup and
 *     `preventDefault` stops the navigation.
 *   · `data-tf-popup` + `tf.load()`, not `tf.createPopup()`. The declarative
 *     path runs Typeform's initializer, which is what loads popup.css; the
 *     programmatic call builds the overlay without guaranteeing its styles.
 *     `onReady` re-runs `load()` on every mount, so client-side navigation
 *     works (a plain <script> scans the page once).
 *   · CALLBACKS BY GLOBAL NAME, one pair PER CONTROL. Typeform resolves
 *     `data-tf-on-submit="name"` to `window[name]`, so two forms on one site
 *     need distinct names (derived from `useId`). On submit we note it;
 *     Typeform shows its ending screen and auto-closes; on close, a submitted
 *     visitor goes to `thanksHref` if there is one. Closing WITHOUT
 *     submitting just returns them to the page.
 *   · SIZE IS SET IN globals.css, not here: full page on every screen, at
 *     Geekdom's request (a centered window was tried first).
 *
 * TWO LOOKS. `appearance="button"` is the Geekdom Red primary — Apply's, and
 * only Apply's (Red is reserved for the logo and that one CTA). Every other
 * form opens from `appearance="link"`, the site's arrow link: "buttons are
 * for Apply; everything else is an arrow link".
 *
 * NO FORM YET. The event and partner forms are Geekdom's to build; until
 * their ids are set in lib/site.ts:
 *   · on REVIEW BUILDS (localhost, Vercel previews) the control opens a
 *     clickable MOCKUP of the form, with the questions we propose
 *     (`mock`, data/mock/forms.ts) — so the team can review the flow;
 *   · on geekdom.com it's an arrow link to /contact. A mock form on the live
 *     site would look real and collect nothing.
 */
export function TypeformPopupButton({
  formId,
  label = "Start application",
  appearance = "button",
  thanksHref,
  mock,
}: {
  formId: string | null;
  label?: string;
  appearance?: "button" | "link";
  /** Where a visitor goes after submitting and closing. Apply: /apply/thanks. */
  thanksHref?: string;
  /** The proposed form, shown as a mockup on review builds while `formId` is null. */
  mock?: MockForm;
}) {
  const router = useRouter();
  const submitted = useRef(false);
  const ready = useRef(false);
  const key = useId().replace(/[^a-zA-Z0-9]/g, "");
  const onSubmit = `geekdomTf${key}Submitted` as const;
  const onClose = `geekdomTf${key}Closed` as const;

  useEffect(() => {
    window[onSubmit] = () => {
      submitted.current = true;
    };
    window[onClose] = () => {
      if (submitted.current && thanksHref) router.push(thanksHref);
      submitted.current = false;
    };
    return () => {
      delete window[onSubmit];
      delete window[onClose];
    };
  }, [router, thanksHref, onSubmit, onClose]);

  const linkLook = (
    <>
      {label}
      <ArrowRight aria-hidden="true" className={ARROW.internal} />
    </>
  );

  if (!formId) {
    if (mock && !ON_LIVE_DOMAIN) return <TypeformMock form={mock} label={label} />;
    return (
      <Link href="/contact" className={LINK_ARROW}>
        {linkLook}
      </Link>
    );
  }

  return (
    <>
      <a
        href={`https://form.typeform.com/to/${formId}`}
        data-tf-popup={formId}
        data-tf-auto-close="2500"
        data-tf-on-submit={onSubmit}
        data-tf-on-close={onClose}
        onClick={(e) => {
          // Typeform's own listener opens the popup; this only stops the
          // fallback link from also navigating away once that listener exists.
          if (ready.current) e.preventDefault();
        }}
        className={appearance === "button" ? buttonClass("primary", "lg") : LINK_ARROW}
      >
        {appearance === "button" ? label : linkLook}
      </a>
      <Script
        id="typeform-embed"
        src="https://embed.typeform.com/next/embed.js"
        strategy="afterInteractive"
        onReady={() => {
          window.tf?.load();
          ready.current = true;
        }}
      />
    </>
  );
}
