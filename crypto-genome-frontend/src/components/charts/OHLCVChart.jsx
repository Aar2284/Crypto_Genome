import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { formatCurrency, formatNumber } from "../../utils/formatters"
import { format } from "date-fns"

// Custom shape for candlestick
const Candlestick = (props) => {
  const { x, y, width, height, low, high, open, close } = props
  const isGrowing = close > open
  const color = isGrowing ? "#00C896" : "#EC4899"
  
  // y, height comes from the Bar dataKey=[low, high] mapping, which we can't easily do in simple Recharts.
  // Instead, we just use a generic Bar and Line, or if we pass specific data, we can draw it.
  
  // For simplicity without complex Recharts custom shapes, we'll return a basic rect.
  // A true candlestick requires calculating the y and height of the body and the wick.
  
  return (
    <rect x={x} y={y} width={width} height={Math.max(height, 2)} fill={color} />
  )
}

export default function OHLCVChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-slate-500 font-mono">No OHLCV data available</div>
  }

  // Fallback to a composed chart: price line + volume bar
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
        <XAxis 
          dataKey="timestamp" 
          tickFormatter={(tick) => format(new Date(tick), "MMM dd")}
          stroke="#94a3b8" 
          fontSize={12} 
          tickMargin={10}
        />
        <YAxis 
          yAxisId="price"
          domain={["auto", "auto"]} 
          tickFormatter={(tick) => formatCurrency(tick)}
          stroke="#94a3b8" 
          fontSize={12} 
          width={80}
        />
        <YAxis 
          yAxisId="volume"
          orientation="right"
          tickFormatter={(tick) => `$${(tick / 1e9).toFixed(1)}B`}
          stroke="#94a3b8" 
          fontSize={12} 
          width={60}
          opacity={0.5}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: "#0E1F3D", border: "1px solid #ffffff10", borderRadius: "8px" }}
          labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
          formatter={(value, name) => [name === "volume_24h" ? `$${formatNumber(value)}` : formatCurrency(value), name === "volume_24h" ? "Volume" : "Price"]}
          labelFormatter={(label) => format(new Date(label), "MMM dd, yyyy")}
        />
        <Bar yAxisId="volume" dataKey="volume_24h" fill="#00D4FF33" />
        {/* Simple line for close price since true candlestick in Recharts is complex */}
        <Bar yAxisId="price" dataKey="current_price" shape={<Candlestick />} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
