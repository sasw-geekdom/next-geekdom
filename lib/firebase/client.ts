import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { envOr } from "@/lib/env";

/**
 * Browser-side Firebase. NEXT_PUBLIC_* values ship to the client by design —
 * this is public web config, not a secret.
 *
 * Only Auth is here. Firestore and Storage are deliberately absent: every read
 * and write goes through the Admin SDK server-side and the security rules deny
 * the client outright, so a client Firestore handle could only ever return
 * permission-denied.
 *
 * Everything is behind a function because `getAuth()` THROWS
 * (`auth/invalid-api-key`) when the config is empty, and /admin/login is
 * prerendered at build time — a module-scope call fails `next build` on any
 * machine without the public config, even though nothing was going to sign in.
 * As a bonus, pages that never authenticate no longer pay to initialize
 * Firebase at all.
 */
function firebaseApp() {
  return getApps().length
    ? getApp()
    : initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      });
}

export function getFirebaseAuth(): Auth {
  return getAuth(firebaseApp());
}

/**
 * Google provider, hinted to the Geekdom workspace domain.
 *
 * `hd` is a UX hint only — it preselects the right account in the picker and is
 * trivially removable by the person signing in. The real gate is server-side in
 * lib/auth/roles.ts.
 */
export function getGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    hd: envOr(process.env.NEXT_PUBLIC_ALLOWED_WORKSPACE_DOMAIN, "geekdom.com"),
    prompt: "select_account",
  });
  return provider;
}
