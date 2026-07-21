import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { paidTier, trialDaysLeft, PAYMENTS_ENFORCED } from "@/lib/pricing";
import UpgradeClient from "./_components/UpgradeClient";

export default async function UpgradePage() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_cycle, subscription_expires_at, trial_ends_at")
    .eq("id", user.id)
    .single();

  const current = paidTier(profile);
  const daysLeft = trialDaysLeft(profile);
  const onTrial = PAYMENTS_ENFORCED && current === "free" && daysLeft !== null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center max-w-xl mx-auto mb-8">
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#1D4ED8]">Plans</span>
        <h1 className="font-display text-2xl sm:text-3xl font-black text-[#0f172a] mt-3">Unlock your full potential</h1>
        <p className="text-sm text-[#64748B] mt-2">
          Pay with <strong>MTN MoMo</strong> or <strong>card</strong>. Cancel anytime — access simply runs to the end of your paid period.
        </p>
        {!PAYMENTS_ENFORCED && (
          <p className="text-xs text-[#94a3b8] mt-3 bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] rounded-xl px-3 py-2 inline-block">
            During the pilot every feature is free — subscribing supports EduBridge, and locks in your plan for when premium features roll out.
          </p>
        )}
        {onTrial && (
          <p className="text-xs text-[#166534] mt-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-3 py-2 inline-block">
            You&apos;re on a free Premium trial — {daysLeft} day{daysLeft === 1 ? "" : "s"} left. Subscribe anytime to keep full access after it ends.
          </p>
        )}
      </div>

      <UpgradeClient
        currentTier={current}
        expiresAt={profile?.subscription_expires_at ?? null}
        trialActive={onTrial}
      />
    </div>
  );
}
