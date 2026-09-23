import Link from "next/link";
import { LINK } from "@/components/site/section";
import type { ContactBlock } from "@/lib/site";

/** A block's address(es) or its page, as links. Shared by /contact and /about. */
export function ContactLinks({ block }: { block: ContactBlock }) {
  if (block.page) {
    return (
      <Link href={block.page.href} className={LINK}>
        {block.page.label}
      </Link>
    );
  }
  return (
    <>
      <a href={`mailto:${block.email}`} className={LINK}>
        {block.email}
      </a>
      {block.alsoEmail && (
        <>
          {" or "}
          <a href={`mailto:${block.alsoEmail}`} className={LINK}>
            {block.alsoEmail}
          </a>
        </>
      )}
    </>
  );
}
