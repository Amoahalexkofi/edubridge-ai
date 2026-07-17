import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { confirmPayment } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function PaymentCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { reference, trxref } = await searchParams;
  const ref = reference ?? trxref;
  const result = ref ? await confirmPayment(ref) : { success: false };

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-8">
        {result.success ? (
          <>
            <div className="h-14 w-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-7 w-7 text-[#16A34A]" />
            </div>
            <h1 className="text-xl font-bold text-[#0f172a]">Payment successful 🎉</h1>
            <p className="text-sm text-[#64748B] mt-2">
              Your <strong className="capitalize">{result.tier}</strong> plan is now active
              {result.cycle === "yearly" ? " for the year" : " for the month"}. Thank you for supporting EduBridge!
            </p>
            <Link href="/student" className="inline-flex mt-6 h-11 px-6 items-center justify-center rounded-xl bg-[#1D4ED8] hover:bg-[#1e40af] text-white text-sm font-bold transition-colors">
              Go to dashboard
            </Link>
          </>
        ) : (
          <>
            <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-7 w-7 text-[#DC2626]" />
            </div>
            <h1 className="text-xl font-bold text-[#0f172a]">Payment not confirmed</h1>
            <p className="text-sm text-[#64748B] mt-2">
              We couldn&apos;t confirm this payment. If money was deducted, it will be reversed automatically — nothing is charged unless the payment completes. You can try again.
            </p>
            <Link href="/student/upgrade" className="inline-flex mt-6 h-11 px-6 items-center justify-center rounded-xl border border-[#E6E4DE] text-[#334155] hover:bg-[#F8F7F4] text-sm font-semibold transition-colors">
              Back to plans
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
