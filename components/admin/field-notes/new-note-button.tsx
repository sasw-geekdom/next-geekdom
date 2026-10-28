"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createNote } from "@/lib/field-notes/actions";
import { cn } from "@/lib/utils";

/*
  "New Field Note" — creates a draft, then opens its editor. A BUTTON, not a
  link: a link that created a note would fire whenever Next prefetched it,
  leaving empty drafts behind a hover. Used by the Field Notes list and the
  Overview's quick actions.
*/
export function NewNoteButton({
  variant = "ink",
  className,
}: {
  variant?: "ink" | "outline";
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        disabled={pending}
        className={className}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await createNote();
            if (res.ok && res.id) router.push(`/portal/admin/field-notes/${res.id}`);
            else setError(("error" in res && res.error) || "Couldn't create a note.");
          });
        }}
      >
        <Plus className="h-4 w-4" strokeWidth={1.8} />
        {pending ? "Creating…" : "New Field Note"}
      </Button>
      {error && (
        <p role="alert" className={cn("text-sm text-geekdom-red")}>
          {error}
        </p>
      )}
    </>
  );
}
