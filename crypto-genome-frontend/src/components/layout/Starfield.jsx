const stars = Array.from({ length: 132 }, (_, index) => {
  const x = (index * 47.37 + (index % 7) * 11) % 100
  const y = (index * 29.71 + (index % 11) * 7) % 100
  const size = index % 17 === 0 ? 2.4 : index % 5 === 0 ? 1.5 : 0.8
  const delay = (index % 19) * -0.31
  return { id: index, x, y, size, delay, bright: index % 13 === 0 }
})

export default function Starfield() {
  return (
    <div className="background-stars" aria-hidden="true">
      {stars.map((star) => <i key={star.id} className={`star ${star.bright ? "star-bright" : ""}`} style={{ "--x": `${star.x}%`, "--y": `${star.y}%`, "--size": `${star.size}px`, "--delay": `${star.delay}s` }} />)}
      <i className="constellation constellation-one" />
      <i className="constellation constellation-two" />
      <i className="orbital-path orbital-path-one" />
      <i className="orbital-path orbital-path-two" />
    </div>
  )
}