// Single source of truth for student plan pricing (GHS). Server routes read
// prices from here so the amount can never be tampered with from the client.

export type Tier = "free" | "basic" | "premium";
export type Cycle = "monthly" | "yearly";

export const PRICING = {
  basic: {
    label: "Basic",
    monthly: 40,
    yearly: 480,
    perks: ["Full lessons", "Quizzes", "Progress tracking"],
  },
  premium: {
    label: "Premium",
    monthly: 60,
    yearly: 720,
    perks: ["Everything in Basic", "AI Tutor", "Mock exams", "Offline access", "Career guidance"],
  },
} as const;

export const FREE_PERKS = ["Limited lessons", "Practice questions", "Community support"];

export function priceGhs(tier: "basic" | "premium", cycle: Cycle): number {
  return PRICING[tier][cycle];
}

export function periodMonths(cycle: Cycle): number {
  return cycle === "yearly" ? 12 : 1;
}

// Enforcement switch. OFF during the pilot → every feature stays open regardless
// of plan. Flip NEXT_PUBLIC_PAYMENTS_ENFORCED=true at launch to turn gating on.
// (Payments themselves are always accepted — the live Paystack key is active.)
export const PAYMENTS_ENFORCED = process.env.NEXT_PUBLIC_PAYMENTS_ENFORCED === "true";

type SubProfile = {
  subscription_tier?: string | null;
  subscription_expires_at?: string | null;
  trial_ends_at?: string | null;
};

// The paid tier a user is actually entitled to right now (expired → free).
// Ignores the free trial — use this for "Current plan" UI so a trial user
// doesn't look like they've already subscribed.
export function paidTier(profile: SubProfile | null | undefined): Tier {
  const tier = profile?.subscription_tier;
  if (!tier || tier === "free") return "free";
  const exp = profile?.subscription_expires_at;
  if (exp && new Date(exp).getTime() > Date.now()) return tier as Tier;
  return "free";
}

// End date of an in-progress free trial, or null if none/expired.
export function trialEndsAt(profile: SubProfile | null | undefined): Date | null {
  const end = profile?.trial_ends_at;
  if (!end) return null;
  const d = new Date(end);
  return d.getTime() > Date.now() ? d : null;
}

// Whole days left in an active trial (min 1), or null if none/expired.
export function trialDaysLeft(profile: SubProfile | null | undefined): number | null {
  const end = trialEndsAt(profile);
  if (!end) return null;
  return Math.max(1, Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

// The tier a user is entitled to right now for gating (hasBasic/hasPremium):
// their paid tier, or full Premium during an active free trial, else free.
export function activeTier(profile: SubProfile | null | undefined): Tier {
  const paid = paidTier(profile);
  if (paid !== "free") return paid;
  return trialEndsAt(profile) ? "premium" : "free";
}

// Gating helpers — while enforcement is OFF these always return true, so no
// feature is locked. At launch they start honouring the active tier.
export function hasBasic(profile: SubProfile | null | undefined): boolean {
  return !PAYMENTS_ENFORCED || activeTier(profile) !== "free";
}
export function hasPremium(profile: SubProfile | null | undefined): boolean {
  return !PAYMENTS_ENFORCED || activeTier(profile) === "premium";
}
