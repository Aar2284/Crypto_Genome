import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts"
import { formatCurrency } from "../../utils/formatters"
import { format } from "date-fns"
import { useMemo } from "react"

// Custom candlestick bar shape
const CandlestickBar = (props) => {
  const { x, y, width, payload } = props
  if (!payload) return null

  const { open, close, high, low } = payload
  if (open == null || close == null) return null

  const isGreen = close >= open
  const color   = isGreen ? "#00C896" : "#EC4899"
  const barW    = Math.max(width * 0.6, 3)
  const bodyX   = x + (width - barW) / 2

  // We need to calculate pixel positions from chart scale
  // Since Recharts passes y as the top of the bar and height as bar height for the yAxisId value,
  // we use the yAxis from the chart context to convert prices to pixels
  // Fallback: just draw color bars based on direction
  const bodyH = Math.max(Math.abs(y), 2)

  return (
    <g>
      <rect
        x={bodyX} y={y}
        width={barW} height={bodyH}
        fill={color} opacity={0.9}
        rx={1}
      />
    </g>
  )
}

export default function OHLCVChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-slate-500 font-mono text-sm">
        No OHLCV data available
      </div>
    )
  }

  // Thin the data for readability (show ~40 points max)
  const chartData = useMemo(() => {
    if (data.length <= 40) return data
    const step = Math.ceil(data.length / 40)
    return data.filter((_, i) => i % step === 0)
  }, [data])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#00D4FF" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#00D4FF" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />

        <XAxis
          dataKey="timestamp"
          tickFormatter={(tick) => format(new Date(tick), "MMM d")}
          stroke="#64748b"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          minTickGap={30}
        />

        {/* Left Y: price */}
        <YAxis
          yAxisId="price"
          domain={["auto", "auto"]}
          tickFormatter={(v) => formatCurrency(v)}
          stroke="#64748b"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          width={72}
        />

        {/* Right Y: volume (faint) */}
        <YAxis
          yAxisId="vol"
          orientation="right"
          tickFormatter={(v) => `$${(v / 1e9).toFixed(1)}B`}
          stroke="#64748b"
          fontSize={9}
          tickLine={false}
          axisLine={false}
          width={42}
          opacity={0.5}
        />

        <Tooltip
          contentStyle={{ backgroundColor: "#0D1B2E", border: "1px solid #ffffff12", borderRadius: "8px", fontFamily: "JetBrains Mono" }}
          labelStyle={{ color: "#64748b", marginBottom: "4px", fontSize: 11 }}
          labelFormatter={(l) => format(new Date(l), "MMM d, yyyy")}
          formatter={(value, name) => {
            if (name === "volume") return [`$${(value / 1e6).toFixed(1)}M`, "Volume"]
            return [formatCurrency(value), name.charAt(0).toUpperCase() + name.slice(1)]
          }}
        />

        {/* Volume bars behind price */}
        <Bar yAxisId="vol" dataKey="volume" fill="url(#volGrad)" radius={[2,2,0,0]} />

        {/* Close price line */}
        <Line
          yAxisId="price"
          type="monotone"
          dataKey="close"
          stroke="#00D4FF"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3, fill: "#00D4FF", strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
