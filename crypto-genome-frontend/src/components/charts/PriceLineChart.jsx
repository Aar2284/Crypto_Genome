import { memo } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts"
import { formatCurrency, formatTimestamp } from "../../utils/formatters.js"

// Chart is purely presentational; it receives sanitized data via props
const PriceLineChart = ({ data, color = "#00D4FF", height = 300 }) => {
  if (!data || data.length === 0) {
    return (
      <div 
        className="w-full flex items-center justify-center font-mono text-sm text-slate-500"
        style={{ height }}
      >
        No chart data available
      </div>
    )
  }

  return (
    <div className="w-full relative z-10" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
          
          <XAxis 
            dataKey="timestamp" 
            stroke="#64748b" 
            fontSize={10}
            fontFamily="JetBrains Mono"
            tickFormatter={(val) => formatTimestamp(val, "HH:mm")}
            tickLine={false}
            axisLine={false}
            minTickGap={30}
          />
          
          <YAxis 
            stroke="#64748b" 
            fontSize={10}
            fontFamily="JetBrains Mono"
            tickFormatter={(val) => formatCurrency(val)}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
          />
          
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "#0E1F3D", 
              borderColor: "#1E3A5F",
              borderRadius: "8px",
              fontFamily: "JetBrains Mono"
            }}
            itemStyle={{ color: "#fff" }}
            labelStyle={{ color: "#64748b", marginBottom: "4px" }}
            labelFormatter={(label) => formatTimestamp(label, "MMM dd, HH:mm")}
            formatter={(value) => [formatCurrency(value), "Price"]}
          />
          
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke={color} 
            strokeWidth={2}
            fillOpacity={1} 
            fill={`url(#gradient-${color})`} 
            activeDot={{ r: 4, strokeWidth: 0, fill: color, filter: "url(#glow)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// React.memo prevents unnecessary rerenders on parent updates if data reference hasn't changed
export default memo(PriceLineChart)
