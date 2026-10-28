# Mock content

Stand-in content for design review. **None of it is real.** It exists so the
Geekdom team can judge layout before the actual content is gathered.

| File | Feeds | Replace with |
| --- | --- | --- |
| `partners.ts` | The partner row — **not on the homepage**; see the note in components/site/partner-row.tsx | Geekdom's real partner list, plus single-color logo files |
| `voices.ts` | "Hear from the people in the room" | Real quotes, names, and roles from real members |

## Removing it

Both sections render nothing when their array is empty, so deleting the
contents of a file removes its section cleanly — no layout hole, no broken
reference. The types (`Partner`, `MemberVoice`) live in `lib/site.ts` and stay.

When the admin portal grows a CMS, these arrays are what it replaces.

**The invented names in `voices.ts` must not reach production.** A testimonial
is a claim about a named person.

## The member portal (`portal.ts`)

| Export | Feeds | Replace with |
| --- | --- | --- |
| `MOCK_DIRECTORY` | `/portal/directory`, the dashboard's "New in the Club" | Members who opt in (Phase 3) |
| `MOCK_FIELD_NOTE` | The dashboard's Field Notes tile | The latest post, once `/field-notes` exists |
| `MOCK_SLACK` | The dashboard's Slack tile | Geekdom's invite link and channels |
| `MOCK_FAQ` | `/portal/resources` | Geekdom's answers — every `confirm: true` is a placeholder |
| `MOCK_RESOURCES` | `/portal/resources` | Real links as each one exists |
| `MOCK_BILLING`, `MOCK_MY_PROFILE` | `/portal/profile` | Stripe, and the member's own directory profile |

Every page that renders these shows a "Sample content" notice. The invented
people and companies must not reach production, same as `voices.ts`.

## Mock Typeforms (`forms.ts`)

| Export | Feeds | Replace with |
| --- | --- | --- |
| `MOCK_EVENTS_FORM` | /club "Plan an event", on review builds only | Geekdom's events Typeform — set `EVENTS_TYPEFORM_ID` in lib/site.ts |
| `MOCK_PARTNER_FORM` | /studio partner "Contact us", on review builds only | Geekdom's partner Typeform — set `STUDIO_PARTNER_TYPEFORM_ID` |

The questions are a proposal for Geekdom to build the real forms from. The
mock never shows on geekdom.com (`ON_LIVE_DOMAIN`), and sends nothing.

## Sample Field Notes (`field-notes.ts`)

Six invented notes for reviewing /field-notes and the note pages. Review
builds only (never geekdom.com), noindex, out of the sitemap and llms.txt.
Delete the array to remove them; real published notes are unaffected.
