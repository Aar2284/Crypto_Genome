import { useMemo } from "react"
import useCryptoStore from "../../store/useCryptoStore.js"
import { formatCurrency } from "../../utils/formatters.js"

export default function MarketTicker() {
  const cryptoData = useCryptoStore((state) => state.cryptoData)
  const quotes = useMemo(() => (cryptoData || []).slice(0, 14), [cryptoData])
  const tape = useMemo(() => [...quotes, ...quotes], [quotes])

  return (
    <aside className="market-ticker" aria-label="Live market ticker">
      <div className="ticker-label"><span className="ticker-led" /> Live tape</div>
      <div className="ticker-viewport">
        {tape.length ? <div className="ticker-track">
          {tape.map((asset, index) => {
            const positive = (asset.change_24h_pct || 0) >= 0
            return <div className="ticker-quote" key={`${asset.symbol}-${index}`}>
              <strong>{asset.symbol}</strong>
              <span>{formatCurrency(asset.current_price)}</span>
              <em className={positive ? "quote-up" : "quote-down"}>{positive ? "▲" : "▼"} {Math.abs(asset.change_24h_pct || 0).toFixed(2)}%</em>
            </div>
          })}
        </div> : <div className="ticker-empty">Waiting for market telemetry…</div>}
      </div>
      <div className="ticker-scan" aria-hidden="true" />
    </aside>
  )
}