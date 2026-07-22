import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { formatNumber } from "../../utils/formatters"

export default function VolumeBarChart({ data, color = "#00C896" }) {
  if (!data || data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-slate-500 font-mono">No data available</div>
  }

  // Expecting data in format: [{ symbol: "BTC", volume: 35000000000 }]
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
        <XAxis 
          dataKey="symbol" 
          stroke="#94a3b8" 
          fontSize={12} 
          tickMargin={10}
        />
        <YAxis 
          tickFormatter={(tick) => `$${(tick / 1e9).toFixed(1)}B`}
          stroke="#94a3b8" 
          fontSize={12} 
          width={60}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: "#0E1F3D", border: "1px solid #ffffff10", borderRadius: "8px" }}
          itemStyle={{ color: color }}
          labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
          formatter={(value) => [`$${formatNumber(value)}`, "Volume"]}
        />
        <Bar 
          dataKey="volume_24h" 
          fill={color} 
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
