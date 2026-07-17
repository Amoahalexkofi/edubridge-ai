import Image from "next/image";
import { WifiOff } from "lucide-react";

// Shown by the service worker when a page is requested with no connection and no
// cached copy. Kept fully static so it precaches and always renders offline.
export const metadata = { title: "You're offline — EduBridge" };

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F3EF] to-[#E5E3DC] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E6E4DE] eb-card p-8 sm:p-10 text-center">
        <Image
          src="/logo-no-bg.png"
          alt="EduBridge Educational Solutions"
          width={160}
          height={64}
          className="h-14 w-auto object-contain mx-auto mb-6"
        />
        <div className="h-14 w-14 rounded-2xl bg-[#F2F1EE] flex items-center justify-center mx-auto mb-4">
          <WifiOff className="h-7 w-7 text-[#94a3b8]" />
        </div>
        <h1 className="text-lg font-bold text-[#0f172a]">You&apos;re offline</h1>
        <p className="text-sm text-[#64748B] mt-1.5 leading-relaxed">
          This page needs a connection. Pages you&apos;ve already opened still work offline — reconnect to load new ones.
        </p>
        <p className="text-xs text-[#94a3b8] mt-6">EduBridge · a Literacy 4 Life project</p>
      </div>
    </div>
  );
}
