import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import CryptoTable from "./CryptoTable.jsx"

export default function CryptoTableWithSearch({ assets = [] }) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const term = searchTerm.toLowerCase()
      return (
        asset.name.toLowerCase().includes(term) ||
        asset.symbol.toLowerCase().includes(term)
      )
    })
  }, [assets, searchTerm])

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-lg
                     bg-navy-800/50 text-white placeholder-slate-400
                     focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent
                     font-mono sm:text-sm transition-all"
          placeholder="Search by name or symbol..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <CryptoTable assets={filteredAssets} />
    </div>
  )
}
