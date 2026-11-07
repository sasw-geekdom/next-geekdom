/*
  FIRST-LOGIN ONBOARDING — a short checklist on the dashboard, not a
  tooltip tour: tours break when layouts change, read badly on a phone and
  with a keyboard, and get dismissed unread. Each step opens the part of
  the portal it's about and counts as done when they use it (or skip it);
  "Not now" folds the panel to a one-line "Finish setting up", and once
  every step is done it never appears again.

  Progress lives on the member (`MemberDoc.onboarding`), so it follows them
  across devices and staff can see it. Members only — staff never see it.

  PURE: the dashboard, the actions and the admin read it.
*/

export const ONBOARDING_STEPS = ["profile", "directory", "events", "slack", "resources"] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export interface StepCopy {
  title: string;
  body: string;
  cta: string;
}

export const STEP_COPY: Record<OnboardingStep, StepCopy> = {
  profile: {
    title: "Check your profile",
    body: "We started it from your application. Make sure it says what you'd want another member to know — and what they can ask you about.",
    cta: "Review your profile",
  },
  directory: {
    title: "See who's in the room",
    body: "You're listed in the member directory. See how you appear, and who else is here. You can hide yourself at Profile.",
    cta: "Open the directory",
  },
  events: {
    title: "Find something to come to",
    body: "Build sessions, meetups and socials — this month's are on the calendar.",
    cta: "See this month",
  },
  slack: {
    title: "Join the member Slack",
    body: "Ask for an intro, offer what you know, and see who's on the floor today.",
    cta: "Join Slack",
  },
  resources: {
    title: "Know the basics",
    body: "Wi-Fi, hours, guests and booking a room — the answers you'd otherwise email us for.",
    cta: "Open FAQ & resources",
  },
};

/** The steps that apply right now — Slack only once there's an invite link. */
export const stepsFor = (hasSlack: boolean): OnboardingStep[] =>
  ONBOARDING_STEPS.filter((s) => s !== "slack" || hasSlack);
