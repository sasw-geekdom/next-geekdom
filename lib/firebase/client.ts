import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserPopupRedirectResolver,
  getAuth,
  GoogleAuthProvider,
  inMemoryPersistence,
  initializeAuth,
  type Auth,
} from "firebase/auth";

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

/*
  IN-MEMORY PERSISTENCE — Firebase keeps nothing in the browser.

  By default the SDK saves the signed-in user to IndexedDB, and opening a
  sign-in link from an email failed on exactly that write: "Database is
  closing" (Safari and the mail apps' in-app browsers close the database
  under it, worst with the original sign-in tab still open), and the form
  showed the raw browser error. Nothing here ever read that saved user — no
  onAuthStateChanged, no currentUser; the credential is traded at once for
  the server's session cookie, which is what keeps you signed in. So the
  browser copy is dropped rather than repaired.

  initializeAuth, not getAuth, because persistence is fixed at creation;
  it throws if called twice for one app, hence the getAuth fallback.
  browserPopupRedirectResolver is passed explicitly because initializeAuth,
  unlike getAuth, doesn't include it — without it "Continue with Google"
  (signInWithPopup) fails.
*/
let auth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  const app = firebaseApp();
  try {
    auth = initializeAuth(app, {
      persistence: inMemoryPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    auth = getAuth(app);
  }
  return auth;
}

/**
 * Google provider, with the account picker always shown.
 *
 * NO `hd` DOMAIN HINT. It used to pin the picker to @geekdom.com, which was
 * right while only staff signed in. Members sign in here too now, mostly with
 * personal Gmail, and the hint hid their accounts. The gate was never the
 * hint — it is server-side, in lib/auth/session.ts.
 */
export function getGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}
