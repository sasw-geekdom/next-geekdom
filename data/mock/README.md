# Mock content

Stand-in content for design review. **None of it is real.** It exists so the
Geekdom team can judge layout before the actual content is gathered.

| File | Feeds | Replace with |
| --- | --- | --- |
| `partners.ts` | The community partner row on the homepage | Geekdom's real partner list, plus single-colour logo files |
| `voices.ts` | "Hear from the people in the room" | Real quotes, names, and roles from real members |

## Removing it

Both sections render nothing when their array is empty, so deleting the
contents of a file removes its section cleanly — no layout hole, no broken
reference. The types (`Partner`, `MemberVoice`) live in `lib/site.ts` and stay.

When the admin portal grows a CMS, these arrays are what it replaces.

**The invented names in `voices.ts` must not reach production.** A testimonial
is a claim about a named person.
