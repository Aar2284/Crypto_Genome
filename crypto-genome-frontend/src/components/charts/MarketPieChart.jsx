import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts"
import { formatCurrency } from "../../utils/formatters"

const COLORS = ["#00D4FF", "#00C896", "#7B2FBE", "#F59E0B", "#EC4899"]

export default function MarketPieChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-slate-500 font-mono">No data available</div>
  }

  // Expecting data in format: [{ symbol: "BTC", market_cap: 1200000000000 }]
  const chartData = [...data].sort((a, b) => b.market_cap - a.market_cap).slice(0, 5)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="market_cap"
          nameKey="symbol"
          stroke="none"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ backgroundColor: "#0E1F3D", border: "1px solid #ffffff10", borderRadius: "8px" }}
          formatter={(value) => [formatCurrency(value), "Market Cap"]}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36} 
          iconType="circle"
          wrapperStyle={{ fontSize: "12px", fontFamily: "JetBrains Mono" }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
