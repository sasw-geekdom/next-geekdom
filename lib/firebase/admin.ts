import "server-only";

import { readFileSync } from "node:fs";
import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";
import { env } from "@/lib/env";

/**
 * Firebase Admin, initialized lazily.
 *
 * Everything here is behind a function on purpose. `cert()` parses the private
 * key eagerly and throws on a missing or malformed one, and Next evaluates
 * every route module while collecting page data during `next build` — so a
 * module-scope `initializeApp` makes the credential a BUILD-time requirement,
 * not a runtime one. That fails CI and preview deploys that were never going to
 * touch Firestore.
 *
 * Deferring to first use puts the failure at the request that actually needed
 * the database, which is where it can be understood.
 */

/**
 * Resolve the service-account credential. Order:
 *   1. GOOGLE_SERVICE_ACCOUNT_KEY — base64 JSON or raw JSON (single line)
 *   2. ./serviceAccountKey.json — local-dev fallback (gitignored)
 */
function loadServiceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim();

  if (raw) {
    // Raw JSON starts with "{"; otherwise treat as base64.
    const json = raw.startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(json) as ServiceAccount;
  }

  try {
    return JSON.parse(
      readFileSync("./serviceAccountKey.json", "utf8"),
    ) as ServiceAccount;
  } catch {
    throw new Error(
      "No Firebase Admin credential found. Set GOOGLE_SERVICE_ACCOUNT_KEY or add ./serviceAccountKey.json.",
    );
  }
}

let app: App | null = null;

export function getAdminApp(): App {
  if (app) return app;

  // Reuse an app the runtime already created — Next's dev server re-evaluates
  // modules on HMR, and a second initializeApp() with the same name throws.
  app =
    getApps()[0] ??
    initializeApp({
      credential: cert(loadServiceAccount()),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });

  return app;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

/**
 * WHICH DATABASE. The live site uses the console's default database, so this
 * is null there. Preview deployments can point FIREBASE_DATABASE_ID at a
 * separate named database ("preview") so staff testing a branch never edit
 * the live site's data — see "Preview data" in AGENTS.md.
 */
export const DATABASE_ID = env(process.env.FIREBASE_DATABASE_ID) ?? null;

/** True when this deployment reads and writes a database other than the live one. */
export const ON_PREVIEW_DATA = DATABASE_ID !== null;

/**
 * A cache key for data read from Firestore. Unchanged for the default
 * database (so the live site's cache is untouched); suffixed for a named
 * one, so a preview's data can never be served from — or into — the live
 * site's cached reads.
 */
export const dataKey = (name: string) => (DATABASE_ID ? `${name}@${DATABASE_ID}` : name);

export function getAdminDb(): Firestore {
  return DATABASE_ID ? getFirestore(getAdminApp(), DATABASE_ID) : getFirestore(getAdminApp());
}

export function getAdminStorage(): Storage {
  return getStorage(getAdminApp());
}
