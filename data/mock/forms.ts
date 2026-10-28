/*
  MOCK TYPEFORMS — the questions WE PROPOSE for Geekdom's forms that don't
  exist yet, shown as a clickable mockup on review builds only
  (components/forms/typeform-mock.tsx; never on geekdom.com). They double as
  the spec: Geekdom builds the real form in Typeform from this list, pastes
  its id into lib/site.ts, and the real popup replaces the mock.

  Nothing here is sent anywhere.
*/

export type MockQuestion =
  | { kind: "text"; label: string; hint?: string; placeholder?: string; long?: boolean }
  | { kind: "pair"; label: string; fields: [string, string] }
  | { kind: "choice"; label: string; options: string[] };

export interface MockForm {
  title: string;
  intro: string;
  questions: MockQuestion[];
  thanks: string;
}

/** /club — "Host an event". Companies only, no membership needed. */
export const MOCK_EVENTS_FORM: MockForm = {
  title: "Host an event at Geekdom",
  intro: "Tell us about your event. It takes about two minutes, and someone on the Geekdom team will get back to you.",
  questions: [
    { kind: "text", label: "What's your company?", placeholder: "Company name" },
    { kind: "pair", label: "Who should we talk to?", fields: ["Your name", "Work email"] },
    {
      kind: "choice",
      label: "What kind of event is it?",
      options: ["Team offsite", "Planning or strategy day", "Workshop or training", "Client or partner event", "Something else"],
    },
    { kind: "choice", label: "Roughly how many people?", options: ["Under 20", "20–50", "50–100", "More than 100"] },
    { kind: "text", label: "When are you thinking?", hint: "A date, a few options, or just a month.", placeholder: "e.g. a Thursday in March" },
    { kind: "text", label: "Anything else we should know?", placeholder: "Format, AV, food, anything", long: true },
  ],
  thanks: "Thanks — someone on the Geekdom team will be in touch.",
};

/** /studio — "If you're a corporate partner". */
export const MOCK_PARTNER_FORM: MockForm = {
  title: "Partner with the Studio",
  intro: "We work with a small number of corporate partners each year. Tell us a little about yours.",
  questions: [
    { kind: "text", label: "What's your company?", placeholder: "Company name" },
    { kind: "pair", label: "Who should we talk to?", fields: ["Your name", "Work email"] },
    {
      kind: "choice",
      label: "How would you like to work with Studio companies?",
      options: ["Pilots", "Talent access", "Follow-on introductions", "Not sure yet"],
    },
    { kind: "text", label: "What should we know?", placeholder: "What you're hoping for", long: true },
  ],
  thanks: "Thanks — we'll be in touch about whether it's a fit.",
};
