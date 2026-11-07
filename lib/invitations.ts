/*
  THE MEMBER INVITATIONS — the launch announcement, sent in waves from
  /portal/admin/members/invitations: a branded email inviting each imported member
  to sign in. They have a login already (the import made it); the email
  just tells them the portal is open and how to get in.

  LOCKED UNTIL LAUNCH. `INVITES_LIVE` is false: the screen shows the email
  as it will land (every admin can see it there — no preview sends), and
  the server refuses a real wave however it's asked. Flip it to true (and
  say so in AGENTS.md) on the day Geekdom announces.

  PURE: the screen and the actions read it.
*/

export const INVITES_LIVE = false;

/** People per wave send: small batches protect the sending domain and the request's time limit. */
export const WAVE_LIMIT = 40;
