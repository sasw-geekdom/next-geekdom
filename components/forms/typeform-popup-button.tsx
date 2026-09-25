"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui/button";

declare global {
  interface Window {
    /** Typeform's embed library. `load()` wires up any `data-tf-*` element not yet set up. */
    tf?: { load: () => void; reload: () => void };
    geekdomApplySubmitted?: () => void;
    geekdomApplyClosed?: () => void;
  }
}

/**
 * "Start application" — OUR button, in the site's design, that opens Geekdom's
 * Typeform as a full-screen popup over the page.
 *
 * WHY A POPUP, NOT THE INLINE EMBED. The inline frame put Typeform's own
 * styling — near-white ground, Inter, a rounded button, a second "Apply to
 * Geekdom" heading — in the middle of a Bone page. Now /apply stays on-brand
 * until the visitor commits, and the form gets the whole screen when they do.
 *
 * HOW IT'S WIRED, all verified against Typeform's embed.js:
 *
 *   · A REAL LINK UNDERNEATH. `href` is the form itself, so before the script
 *     loads — or if it's blocked — the button still works; it just leaves the
 *     site. Once the script is ready, the click opens the popup and
 *     `preventDefault` stops the navigation.
 *   · `data-tf-popup` + `tf.load()`, not `tf.createPopup()`. The declarative
 *     path runs Typeform's initializer, which is what loads popup.css; the
 *     programmatic call builds the overlay without guaranteeing its styles.
 *     `onReady` re-runs `load()` on every mount, so client-side navigation to
 *     /apply works (a plain <script> scans the page once).
 *   · CALLBACKS BY GLOBAL NAME. Typeform resolves `data-tf-on-submit="name"`
 *     to `window[name]`. On submit we note it; Typeform shows its ending
 *     screen and auto-closes; on close, a submitted visitor goes to
 *     /apply/thanks. Closing WITHOUT submitting just returns them to /apply.
 *   · SIZE IS SET IN globals.css, not here: a centered 880x680 window (smaller
 *     on a short screen) on desktop, edge to edge on a phone. Full screen
 *     was tried and felt like leaving the site.
 */
export function TypeformPopupButton({
  formId,
  label = "Start application",
}: {
  formId: string;
  label?: string;
}) {
  const router = useRouter();
  const submitted = useRef(false);
  const ready = useRef(false);

  useEffect(() => {
    window.geekdomApplySubmitted = () => {
      submitted.current = true;
    };
    window.geekdomApplyClosed = () => {
      if (submitted.current) router.push("/apply/thanks");
    };
    return () => {
      delete window.geekdomApplySubmitted;
      delete window.geekdomApplyClosed;
    };
  }, [router]);

  return (
    <>
      <a
        href={`https://form.typeform.com/to/${formId}`}
        data-tf-popup={formId}
        data-tf-auto-close="2500"
        data-tf-on-submit="geekdomApplySubmitted"
        data-tf-on-close="geekdomApplyClosed"
        onClick={(e) => {
          // Typeform's own listener opens the popup; this only stops the
          // fallback link from also navigating away once that listener exists.
          if (ready.current) e.preventDefault();
        }}
        className={buttonClass("primary", "lg")}
      >
        {label}
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
