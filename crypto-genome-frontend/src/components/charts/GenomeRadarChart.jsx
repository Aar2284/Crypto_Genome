import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from "recharts"

const DIMENSION_MAP = {
  dimension_1: "Volatility",
  dimension_2: "Correlation",
  dimension_3: "Momentum",
  dimension_4: "Drawdown",
  dimension_5: "Liquidity",
}

export default function GenomeRadarChart({ genomeData }) {
  if (!genomeData || genomeData.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-slate-500 font-mono">No genome data available</div>
  }

  // Transform data for Recharts RadarChart
  // We need an array of objects where each object represents a dimension
  // e.g., { subject: "Volatility", BTC: 0.4, ETH: 0.6, SOL: 0.9 }
  
  const chartData = Object.keys(DIMENSION_MAP).map(dimKey => {
    const dataPoint = { subject: DIMENSION_MAP[dimKey] }
    genomeData.forEach(coin => {
      dataPoint[coin.symbol] = coin[dimKey]
    })
    return dataPoint
  })

  const COLORS = ["#00D4FF", "#00C896", "#7B2FBE"]

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
        <PolarGrid stroke="#ffffff20" />
        <PolarAngleAxis 
          dataKey="subject" 
          tick={{ fill: "#94a3b8", fontSize: 12, fontFamily: "JetBrains Mono" }} 
        />
        <PolarRadiusAxis 
          angle={30} 
          domain={[0, 1]} 
          tick={{ fill: "#64748b", fontSize: 10 }}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{ backgroundColor: "#0E1F3D", border: "1px solid #ffffff10", borderRadius: "8px" }}
          labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
        />
        <Legend 
          wrapperStyle={{ fontSize: "12px", fontFamily: "JetBrains Mono" }}
        />
        {genomeData.map((coin, index) => (
          <Radar
            key={coin.symbol}
            name={coin.symbol}
            dataKey={coin.symbol}
            stroke={COLORS[index % COLORS.length]}
            fill={COLORS[index % COLORS.length]}
            fillOpacity={0.3}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  )
}
