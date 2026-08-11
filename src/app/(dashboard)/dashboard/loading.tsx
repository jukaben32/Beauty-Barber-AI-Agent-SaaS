export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 rounded-[30px] bg-white/80" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-28 rounded-[28px] bg-white/80" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.34fr_0.86fr]">
        <div className="h-[420px] rounded-[30px] bg-white/80" />
        <div className="h-[420px] rounded-[30px] bg-white/80" />
      </div>
    </div>
  )
}
