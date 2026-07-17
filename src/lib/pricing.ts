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

type SubProfile = { subscription_tier?: string | null; subscription_expires_at?: string | null };

// The tier a user is actually entitled to right now (expired → free).
export function activeTier(profile: SubProfile | null | undefined): Tier {
  const tier = profile?.subscription_tier;
  if (!tier || tier === "free") return "free";
  const exp = profile?.subscription_expires_at;
  if (exp && new Date(exp).getTime() > Date.now()) return tier as Tier;
  return "free";
}

// Gating helpers — while enforcement is OFF these always return true, so no
// feature is locked. At launch they start honouring the active tier.
export function hasBasic(profile: SubProfile | null | undefined): boolean {
  return !PAYMENTS_ENFORCED || activeTier(profile) !== "free";
}
export function hasPremium(profile: SubProfile | null | undefined): boolean {
  return !PAYMENTS_ENFORCED || activeTier(profile) === "premium";
}
