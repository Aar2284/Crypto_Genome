export default function SkeletonLoader({ className = "", count = 1 }) {
  return <div className="space-y-2" aria-busy="true" aria-label="Loading content">{Array.from({ length: count }, (_, index) => <div key={index} className={`rounded-lg bg-gradient-to-r from-white/[0.035] via-white/[0.09] to-white/[0.035] bg-[length:200%_100%] animate-[shimmer_1.8s_ease-in-out_infinite] ${className}`} />)}</div>
}
