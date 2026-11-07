"use client";

import * as React from "react";

/*
  What the last decision did, shown on the next item in the queue. It
  arrives as ?done=…; once shown, it's taken out of the address bar, so a
  refresh or a copied link doesn't repeat it.
*/
export function Flash({ text }: { text: string }) {
  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("done")) return;
    url.searchParams.delete("done");
    window.history.replaceState(window.history.state, "", url);
  }, []);
  return (
    <p role="status" className="mt-4 border border-dashed border-border px-3 py-2 text-sm text-graphite">
      {text}
    </p>
  );
}
