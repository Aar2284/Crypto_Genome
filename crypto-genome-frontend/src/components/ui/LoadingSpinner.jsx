export default function LoadingSpinner({ size = 40 }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div
        className="rounded-full border-2 border-accent/20 border-t-accent animate-spin"
        style={{ width: size, height: size }}
      />
    </div>
  )
}
