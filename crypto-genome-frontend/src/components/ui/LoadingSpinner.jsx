export default function LoadingSpinner({ size = 24, label = "Loading" }) {
  return <div className="h-full w-full min-h-[72px] flex items-center justify-center" role="status" aria-label={label}><span className="rounded-full border-2 border-cyan-300/15 border-t-cyan-300 animate-spin" style={{ width: size, height: size }} /></div>
}
