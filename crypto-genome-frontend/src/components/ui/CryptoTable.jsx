import { memo, useState, useMemo } from "react"
import { 
  formatCurrency, 
  formatCompactNumber, 
  formatPercentage, 
  getTrendDirection 
} from "../../utils/formatters.js"

// Table Row component extracted for render efficiency when WebSocket streams update individual rows
const CryptoTableRow = memo(({ asset }) => {
  const trend = getTrendDirection(asset.change_24h_pct)
  
  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors duration-150 group">
      {/* Asset Column */}
      <td className="p-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center font-display font-bold text-xs text-white border border-white/10 group-hover:border-accent/50 transition-colors">
            {asset.symbol?.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-white">{asset.name || "Unknown"}</div>
            <div className="text-xs text-slate-500 font-mono">{asset.symbol || "N/A"}</div>
          </div>
        </div>
      </td>
      
      {/* Price Column */}
      <td className="p-4 text-right font-mono whitespace-nowrap">
        {formatCurrency(asset.current_price)}
      </td>
      
      {/* 24h Change Column */}
      <td className={`p-4 text-right font-mono whitespace-nowrap
        ${trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-slate-400"}`}
      >
        {formatPercentage(asset.change_24h_pct)}
      </td>
      
      {/* Volume Column */}
      <td className="p-4 text-right font-mono text-slate-300 hidden sm:table-cell whitespace-nowrap">
        {formatCompactNumber(asset.volume_24h)}
      </td>
      
      {/* Market Cap Column */}
      <td className="p-4 text-right font-mono text-slate-300 hidden md:table-cell whitespace-nowrap">
        {formatCompactNumber(asset.market_cap)}
      </td>
    </tr>
  )
})

// Main Table Component
const CryptoTable = ({ data = [], isLoading = false, error = null }) => {
  // Sort state scaffold for future live-sorting implementation
  const [sortConfig, setSortConfig] = useState({ key: "market_cap", direction: "desc" })

  // Memoized sort logic to prevent expensive recalculations
  const sortedData = useMemo(() => {
    if (!data) return []
    let sortableData = [...data]
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        const aVal = a[sortConfig.key] ?? 0
        const bVal = b[sortConfig.key] ?? 0
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }
    return sortableData
  }, [data, sortConfig])

  // Sort handler
  const handleSort = (key) => {
    let direction = "desc"
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc"
    }
    setSortConfig({ key, direction })
  }

  // Render header cell with sort indicator
  const SortableHeader = ({ label, sortKey, align = "left", hiddenOn = "" }) => (
    <th 
      onClick={() => handleSort(sortKey)}
      className={`p-4 text-${align} text-xs font-mono text-slate-400 uppercase tracking-widest cursor-pointer hover:text-accent select-none ${hiddenOn} transition-colors`}
    >
      {label} {sortConfig.key === sortKey ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
    </th>
  )

  if (isLoading) {
    return (
      <div className="w-full p-8 border border-white/5 rounded-xl bg-navy-800/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
        <span className="font-mono text-sm text-slate-400">Loading market data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full p-8 border border-red-500/20 rounded-xl bg-red-500/5 backdrop-blur-sm flex items-center justify-center">
        <span className="font-mono text-sm text-red-400">Failed to load market data: {error}</span>
      </div>
    )
  }

  if (sortedData.length === 0) {
    return (
      <div className="w-full p-8 border border-white/5 rounded-xl bg-navy-800/50 backdrop-blur-sm flex items-center justify-center">
        <span className="font-mono text-sm text-slate-400">No market data available.</span>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-white/5 bg-navy-800/80 backdrop-blur-sm relative z-10 shadow-xl shadow-black/20">
      <table className="w-full text-sm text-left">
        <thead className="bg-navy-900/80 border-b border-white/10 sticky top-0 z-20">
          <tr>
            <SortableHeader label="Asset" sortKey="name" />
            <SortableHeader label="Price" sortKey="current_price" align="right" />
            <SortableHeader label="24h Change" sortKey="change_24h_pct" align="right" />
            <SortableHeader label="Volume" sortKey="volume_24h" align="right" hiddenOn="hidden sm:table-cell" />
            <SortableHeader label="Market Cap" sortKey="market_cap" align="right" hiddenOn="hidden md:table-cell" />
          </tr>
        </thead>
        <tbody>
          {sortedData.map((asset) => (
            <CryptoTableRow key={asset.asset_id} asset={asset} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default memo(CryptoTable)
