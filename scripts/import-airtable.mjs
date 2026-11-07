// IMPORT GEEKDOM'S AIRTABLE ("MASTER - ALL") — the applications Geekdom
// reviewed before the site ran the workflow, and the members they approved.
//
//   npm run import:airtable -- "<path to the CSV>"            dry run: counts only, writes nothing
//   npm run import:airtable -- "<path to the CSV>" --commit   writes
//
// The CSV is the view's "Download CSV". It holds real people's details, so it
// lives outside the repo — never commit it.
//
// HOW EACH ROW LANDS (Geekdom's two steps: "Recommendation" is the initial
// review's call, "Status: Approved" + "Response Sent" is the team's):
//
//   Approved, response sent      → approved application + an ACTIVE MEMBER
//                                  (Solo, joined the day the response went
//                                  out, a login, a directory profile LISTED
//                                  by default — Geekdom's call)
//   Approved, no response sent   → team review ("approved in Airtable, never
//                                  told" — approve here to send it properly)
//   Reviewed, recommended Approve → team review
//   Reviewed, recommended Deny    → initial review, the Deny in the notes
//                                  (no response was ever sent: decline here,
//                                  and the branded email goes out)
//   Reviewed, "Banned Camp"       → banned
//
// NO EMAIL IS SENT. Logins are created unverified, exactly like "Add a
// member" (lib/admin/member-logins.ts); the first sign-in verifies them.
//
// RE-RUNNABLE: an application already imported for that email, or a member
// who already exists, is skipped — never duplicated or overwritten.
//
// Writes to the database the environment names (FIREBASE_DATABASE_ID, or
// the default — the live one). The dry run says which.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { cert, initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const commit = args.includes("--commit");
if (!file) {
  console.error('Usage: npm run import:airtable -- "<path to MASTER - ALL.csv>" [--commit]');
  process.exit(1);
}

// ─── CSV (RFC 4180: quoted fields may hold commas, quotes and newlines) ─────
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") endField();
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      endRow();
    } else field += c;
  }
  if (field || row.length) endRow();
  const [header, ...body] = rows.filter((r) => r.some((v) => v.trim()));
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.replace(/^\uFEFF/, "").trim(), (r[i] ?? "").trim()])));
}

// "10/16/2026" → noon Central that day (midnight UTC is the evening before here).
function centralNoon(mdy) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(mdy || "");
  if (!m) return null;
  return Timestamp.fromDate(new Date(Date.UTC(+m[3], +m[1] - 1, +m[2], 18)));
}

// The multi-select joins options with commas; an option holding a comma is quoted.
const options = (v) => {
  if (!v) return [];
  const out = [];
  let cur = "";
  let q = false;
  for (const c of v) {
    if (c === '"') q = !q;
    else if (c === "," && !q) {
      out.push(cur.trim());
      cur = "";
    }
    else cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
};

const site = (v) => {
  const t = (v || "").trim();
  if (!t) return { website: "", linkedin: "" };
  const href = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  return /linkedin\.com/i.test(t) ? { website: "", linkedin: href } : { website: href, linkedin: "" };
};

// A directory headline is one line: the "brag", cut at a word boundary.
const headline = (s) => {
  const t = (s || "").replace(/\s+/g, " ").trim();
  if (t.length <= 160) return t;
  return `${t.slice(0, 157).replace(/\s+\S*$/, "")}…`;
};

// ─── Plan each row ──────────────────────────────────────────────────────────
const rows = parseCsv(readFileSync(file, "utf8"));
const BY = "Geekdom (Airtable)";

function plan(r) {
  const status = r["Status"];
  const rec = r["Recommendation"];
  const sent = centralNoon(r["Response Sent"]);
  const created = centralNoon(r["Record Created"]) ?? Timestamp.now();
  const decisions = [];
  let to;
  let note = "";
  if (rec === "Banned Camp") {
    to = "banned";
    decisions.push({ stage: "staff", outcome: "banned", by: BY, at: created, note: "Recommendation in Airtable: Banned Camp." });
  } else if (status === "Approved" && sent) {
    to = "approved";
    if (rec) decisions.push({ stage: "initial", outcome: `recommended ${rec.toLowerCase()}`, by: BY, at: created });
    decisions.push({ stage: "team", outcome: "approved (response sent)", by: BY, at: sent });
  } else if (status === "Approved") {
    to = "team_review";
    note = "Approved in Airtable, but no response was ever sent. Approve here to send the congratulations properly.";
    if (rec) decisions.push({ stage: "initial", outcome: `recommended ${rec.toLowerCase()}`, by: BY, at: created });
  } else if (rec === "Approve") {
    to = "team_review";
    decisions.push({ stage: "initial", outcome: "recommended approve", by: BY, at: created });
  } else {
    to = "initial_review";
    if (rec) note = `Airtable recommendation: ${rec}. No response was ever sent — decide here, and the email goes out.`;
  }

  const describes = options(r["Which best describes you? Pick all that apply."]);
  const application = {
    name: r["Full Name"] || `${r["First Name"]} ${r["Last Name"]}`.trim(),
    firstName: r["First Name"],
    lastName: r["Last Name"],
    email: r["Email"].toLowerCase(),
    phone: r["Phone"],
    city: r["City"],
    website: r["LinkedIn or Personal Site"],
    heardAbout: r["How did you hear about Geekdom?"],
    heardAboutOther: r["Other (How did you hear...)"],
    brag: r["Brag about yourself in one sentence."],
    building: r["What are you building?"],
    shipped: r["What have you shipped, sold or built in the last 90 days?"],
    links: r["Links to work"],
    describes,
    describesOther: r["Other (Which describes you...)"],
    whyGeekdom: r["Why do you want to be a part of Geekdom specifically?"],
    giveBack: r["What will you give back to the community?"],
    excited: r["What are you most excited to do over the next 6 months as a member of Geekdom?"],
    otherCommunities: r["Currently a part of other community, accelerator, incubator or program?"],
    anythingElse: r["Anything else we should know or you want to share?"],
    formerMember: Boolean(r["Current Geekdom Member"]),
    plan: "solo",
    source: "airtable",
    status: to,
    decisions,
    ...(note ? { notes: note } : {}),
    reviewedBy: null,
    reviewedAt: null,
    invitedAt: null,
    paidAt: null,
    createdAt: created,
  };
  // Firestore rejects undefined, and empty answers read better absent.
  for (const k of Object.keys(application)) if (application[k] === "" || application[k] === undefined) delete application[k];
  return { application, member: to === "approved" ? { joinedAt: sent } : null };
}

const planned = rows.map(plan);

// ─── Write (or count) ───────────────────────────────────────────────────────
const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim() || readFileSync("./serviceAccountKey.json", "utf8");
const app = initializeApp({ credential: cert(JSON.parse(raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8"))) });
const dbId = process.env.FIREBASE_DATABASE_ID?.trim() || null;
const db = dbId ? getFirestore(app, dbId) : getFirestore(app);
const auth = getAuth(app);

const tally = { rows: rows.length, byStatus: {}, applicationsNew: 0, applicationsSkipped: 0, membersNew: 0, membersSkipped: 0, loginsNew: 0, loginsExisting: 0 };
for (const { application: a, member } of planned) {
  tally.byStatus[a.status] = (tally.byStatus[a.status] ?? 0) + 1;

  const existingApp = await db.collection("applications").where("email", "==", a.email).get();
  const already = existingApp.docs.find((d) => d.data().source === "airtable");
  let applicationId = already?.id;
  if (already) tally.applicationsSkipped++;
  else {
    tally.applicationsNew++;
    if (commit) applicationId = (await db.collection("applications").add(a)).id;
  }

  if (!member) continue;
  const existingMember = await db.collection("members").where("email", "==", a.email).limit(1).get();
  if (!existingMember.empty) tally.membersSkipped++;
  else {
    tally.membersNew++;
    const links = site(a.website);
    const now = Timestamp.now();
    const doc = {
      name: a.name,
      email: a.email,
      applicationId: applicationId ?? null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      status: "active",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      joinedAt: member.joinedAt,
      updatedAt: now,
      source: "import",
      plan: "solo",
      tags: [],
      notes: "",
      profile: {
        headline: headline(a.brag),
        role: "",
        company: "",
        audience: "",
        askMeAbout: [],
        lookingFor: "",
        bio: a.building ?? "",
        website: links.website,
        linkedin: links.linkedin,
        listed: true,
      },
    };
    if (commit) await db.collection("members").add(doc);
  }

  const login = await auth.getUserByEmail(a.email).catch(() => null);
  if (login) tally.loginsExisting++;
  else {
    tally.loginsNew++;
    if (commit) await auth.createUser({ email: a.email, displayName: a.name, emailVerified: false });
  }
}

console.log(commit ? "IMPORTED" : "DRY RUN — nothing written");
console.log(`Database: ${dbId ?? "(default) — the live database"}`);
console.log(JSON.stringify(tally, null, 2));
