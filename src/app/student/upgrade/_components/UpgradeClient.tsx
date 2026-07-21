"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles, Crown } from "lucide-react";
import { toast } from "sonner";
import { PRICING, FREE_PERKS, type Cycle, type Tier } from "@/lib/pricing";

export default function UpgradeClient({
  currentTier, expiresAt, trialActive, grandfathered,
}: { currentTier: Tier; expiresAt: string | null; trialActive?: boolean; grandfathered?: boolean }) {
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [loading, setLoading] = useState<string | null>(null);

  async function subscribe(tier: "basic" | "premium") {
    setLoading(tier);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, cycle }),
      });
      const data = await res.json();
      if (!res.ok || !data.authorization_url) {
        toast.error(data.error ?? "Could not start payment.");
        setLoading(null);
        return;
      }
      window.location.href = data.authorization_url; // Paystack hosted checkout
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <>
      {/* Billing cycle toggle */}
      <div className="flex justify-center mb-7">
        <div className="inline-flex gap-1 p-1 bg-[#F2F1EE] rounded-xl">
          {(["monthly", "yearly"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={`h-9 px-4 rounded-lg text-sm font-bold capitalize transition-all ${
                cycle === c ? "bg-white text-[#1D4ED8] shadow-sm" : "text-[#64748B] hover:text-slate-900"
              }`}
            >
              {c}
              {c === "yearly" && <span className="ml-1.5 text-[10px] font-bold text-[#16A34A]">2 months free</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* Free */}
        <PlanCard
          name="Free"
          price="GHS 0"
          sub="forever"
          perks={FREE_PERKS}
          current={currentTier === "free"}
        />

        {/* Basic */}
        <PlanCard
          name="Basic"
          price={`GHS ${PRICING.basic[cycle]}`}
          sub={cycle === "yearly" ? "per year" : "per month"}
          perks={PRICING.basic.perks}
          current={currentTier === "basic"}
          cta={
            <SubscribeButton
              label={currentTier === "basic" ? "Renew Basic" : "Choose Basic"}
              onClick={() => subscribe("basic")}
              loading={loading === "basic"}
              variant="outline"
            />
          }
        />

        {/* Premium */}
        <PlanCard
          name="Premium"
          price={`GHS ${PRICING.premium[cycle]}`}
          sub={cycle === "yearly" ? "per year" : "per month"}
          perks={PRICING.premium.perks}
          highlight
          icon={<Crown className="h-4 w-4 text-[#E8722A]" />}
          current={currentTier === "premium"}
          badgeLabel={trialActive ? "Trial" : grandfathered ? "Member" : undefined}
          cta={
            <SubscribeButton
              label={currentTier === "premium" ? "Renew Premium" : "Go Premium"}
              onClick={() => subscribe("premium")}
              loading={loading === "premium"}
              variant="solid"
            />
          }
        />
      </div>

      {currentTier !== "free" && expiryLabel && (
        <p className="text-center text-sm text-[#64748B] mt-6">
          Your <strong className="capitalize">{currentTier}</strong> access is active until <strong>{expiryLabel}</strong>.
        </p>
      )}
    </>
  );
}

function PlanCard({
  name, price, sub, perks, highlight, current, badgeLabel, cta, icon,
}: {
  name: string; price: string; sub: string; perks: readonly string[];
  highlight?: boolean; current?: boolean; badgeLabel?: string; cta?: React.ReactNode; icon?: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border p-6 flex flex-col ${highlight ? "border-[#E8722A] bg-white eb-card shadow-[0_8px_30px_rgba(232,114,42,0.12)]" : "border-[#E6E4DE] bg-white eb-card"}`}>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-bold text-lg text-[#0f172a]">{name}</h3>
        {current && <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8]">Current</span>}
        {!current && badgeLabel && <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#166534]">{badgeLabel}</span>}
      </div>
      <div className="mt-3">
        <span className="text-3xl font-black text-[#0f172a] tabular-nums">{price}</span>
        <span className="text-sm text-[#94a3b8] ml-1">/ {sub}</span>
      </div>
      <ul className="mt-5 space-y-2.5 flex-1">
        {perks.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm text-[#334155]">
            <Check className="h-4 w-4 text-[#16A34A] flex-shrink-0 mt-0.5" /> {p}
          </li>
        ))}
      </ul>
      {cta && <div className="mt-6">{cta}</div>}
    </div>
  );
}

function SubscribeButton({ label, onClick, loading, variant }: { label: string; onClick: () => void; loading: boolean; variant: "solid" | "outline" }) {
  const base = "w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all disabled:opacity-60";
  const style = variant === "solid"
    ? "bg-[#E8722A] hover:bg-[#d4641e] text-white shadow-[0_4px_14px_rgba(232,114,42,0.3)]"
    : "border border-[#1D4ED8] text-[#1D4ED8] hover:bg-[#EFF6FF]";
  return (
    <button onClick={onClick} disabled={loading} className={`${base} ${style}`}>
      {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Starting…</> : <><Sparkles className="h-4 w-4" /> {label}</>}
    </button>
  );
}
