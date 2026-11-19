"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";
import { removeMyPhoto, uploadMyPhoto } from "@/lib/portal/photo-actions";

/*
  THE PROFILE PHOTO FIELD — square, like every image here. The photo is
  shrunk IN THE BROWSER first (longest side 1024px, JPEG) so a 6MB phone
  picture uploads as ~150KB under the server action's 1MB limit; the server
  then crops, strips metadata and stores it (lib/portal/photo-actions.ts).
*/

async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("shrink failed"))), "image/jpeg", 0.88));
}

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export function PhotoField({
  photo,
  name,
  onChange,
  local = false,
}: {
  photo: string | null;
  name: string;
  /** Told when the photo is added or removed — the welcome flow requires one. */
  onChange?: (url: string | null) => void;
  /** Staff preview: show the chosen picture in the browser, upload nothing. */
  local?: boolean;
}) {
  const router = useRouter();
  const input = React.useRef<HTMLInputElement>(null);
  const [current, setCurrent] = React.useState(photo);
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<{ ok: boolean; text: string } | null>(null);

  async function choose(file: File | undefined) {
    if (!file) return;
    setPending(true);
    setMessage(null);
    if (local) {
      const url = URL.createObjectURL(file);
      setCurrent(url);
      onChange?.(url);
      setMessage({ ok: true, text: "Preview only — not saved (staff preview)." });
      setPending(false);
      return;
    }
    try {
      const small = await shrink(file);
      const form = new FormData();
      form.set("photo", new File([small], "photo.jpg", { type: "image/jpeg" }));
      const res = await uploadMyPhoto(form);
      if (res.ok && res.url) {
        setCurrent(res.url);
        onChange?.(res.url);
      }
      setMessage({ ok: res.ok, text: res.message });
      router.refresh();
    } catch {
      setMessage({ ok: false, text: "That file couldn't be read as a photo. Try a JPEG or PNG." });
    } finally {
      setPending(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    if (local) {
      setCurrent(null);
      onChange?.(null);
      setMessage(null);
      return;
    }
    setPending(true);
    const res = await removeMyPhoto();
    if (res.ok) {
      setCurrent(null);
      onChange?.(null);
    }
    setMessage({ ok: res.ok, text: res.message });
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-5">
      {current ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current} alt="Your profile photo" width={96} height={96} className="h-24 w-24 shrink-0 border border-border bg-bone object-cover" />
      ) : (
        <span aria-hidden="true" className={cn(MONO.label, "flex h-24 w-24 shrink-0 items-center justify-center bg-graphite text-bone")}>
          {initials(name) || <Camera className="h-5 w-5" strokeWidth={1.6} />}
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => input.current?.click()}>
            {pending ? "Saving…" : current ? "Change photo" : "Add a photo"}
          </Button>
          {current && !pending && (
            <button type="button" onClick={remove} className="text-sm text-muted-foreground underline underline-offset-2 hover:text-graphite">
              Remove
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">A clear photo of your face helps members recognize you on the floor.</p>
        {message && (
          <p role={message.ok ? "status" : "alert"} className={cn("text-sm", message.ok ? "text-graphite" : "text-geekdom-red")}>
            {message.text}
          </p>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="sr-only" tabIndex={-1} onChange={(e) => choose(e.target.files?.[0])} />
    </div>
  );
}
