// Copy the live site's CONTENT into the preview database, so a preview build
// starts with real events, the portfolio wall and the site settings — and
// nothing personal.
//
//   npm run preview:seed            → into the "preview" database
//   npm run preview:seed -- staging → into a database named "staging"
//
// COPIES: events, portfolio, settings (the photo-wall manifest, email copy,
// member resources). NEVER COPIES: members, applications, activity,
// authThrottle, staff — people's data stays in the live database — and
// fieldNotes: a note's photos live under its id in the ONE Blob store every
// deployment shares, so deleting a copied note in a preview would delete the
// live note's files. Previews show the sample notes instead.
//
// Only into empty collections: a collection that already has documents in
// the target is skipped, so running it twice never duplicates or overwrites
// a tester's edits. Reads credentials from .env.local (GOOGLE_SERVICE_ACCOUNT_KEY).
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { cert, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const COPY = ["events", "portfolio", "settings"];
const target = process.argv[2] || "preview";
if (target === "(default)" || target === "default") {
  console.error("Refusing: the target must be a separate database, never the live one.");
  process.exit(1);
}

const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim() || readFileSync("./serviceAccountKey.json", "utf8");
const account = JSON.parse(raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8"));
const app = initializeApp({ credential: cert(account) });
const live = getFirestore(app);
const preview = getFirestore(app, target);

for (const name of COPY) {
  if (!(await preview.collection(name).limit(1).get()).empty) {
    console.log(`${name}: already has documents in "${target}" — skipped`);
    continue;
  }
  const docs = (await live.collection(name).get()).docs;
  for (let i = 0; i < docs.length; i += 400) {
    const batch = preview.batch();
    for (const d of docs.slice(i, i + 400)) batch.set(preview.collection(name).doc(d.id), d.data());
    await batch.commit();
  }
  console.log(`${name}: copied ${docs.length} into "${target}"`);
}
