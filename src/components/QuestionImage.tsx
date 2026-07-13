// Renders a question's diagram/figure, if it has one. Shared by the exam taker,
// practice mode, and the exam review page so a diagram shows everywhere a
// question does. Plain <img> (not next/image) since sources are user uploads
// from Supabase Storage.
export default function QuestionImage({ src, className = "" }: { src?: string | null; className?: string }) {
  if (!src) return null;
  return (
    <div className={`my-3 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Question diagram"
        loading="lazy"
        className="max-w-full max-h-80 w-auto h-auto rounded-xl border border-[#E6E4DE] bg-white"
      />
    </div>
  );
}
