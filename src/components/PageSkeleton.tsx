// Instant navigation feedback. Rendered by each section's loading.tsx while
// the server component fetches — the persistent nav stays, only the content
// area shows this calm warm skeleton so a click never feels frozen.

function Block({ className = "" }: { className?: string }) {
  return <div className={`rounded-xl bg-[#EEEDE8] ${className}`} />;
}

export default function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8 animate-pulse" aria-hidden>
      {/* Greeting / title row */}
      <div className="flex items-center justify-between mb-7">
        <div className="space-y-2">
          <Block className="h-3.5 w-24" />
          <Block className="h-7 w-40" />
        </div>
        <Block className="h-8 w-20 rounded-full" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-[#E6E4DE] bg-white p-4 sm:p-5 space-y-3">
            <Block className="h-9 w-9 rounded-xl" />
            <Block className="h-6 w-12" />
            <Block className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Wide banner */}
      <Block className="h-20 w-full rounded-2xl mb-6" />

      {/* Two-column content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[#E6E4DE] bg-white p-5 space-y-3">
              <Block className="h-4 w-32" />
              <Block className="h-3 w-full" />
              <Block className="h-3 w-4/5" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[#E6E4DE] bg-white p-4 space-y-3">
              <Block className="h-4 w-24" />
              <Block className="h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
