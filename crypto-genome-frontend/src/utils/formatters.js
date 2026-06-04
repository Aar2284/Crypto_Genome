import { format, parseISO } from "date-fns"

// Standard USD currency formatting with smart decimals
export const formatCurrency = (value) => {
  if (value === null || value === undefined) return "N/A"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value)
}

// Compact numbers for market cap and volume (e.g., 1.2B)
export const formatCompactNumber = (value) => {
  if (value === null || value === undefined) return "N/A"
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value)
}

// Percentage formatting with directional signs
export const formatPercentage = (value) => {
  if (value === null || value === undefined) return "N/A"
  const prefix = value > 0 ? "+" : ""
  return `${prefix}${value.toFixed(2)}%`
}

// Timestamp formatting (ISO 8601 to human readable)
export const formatTimestamp = (isoString, formatStr = "HH:mm:ss") => {
  if (!isoString) return "N/A"
  try {
    return format(parseISO(isoString), formatStr)
  } catch (e) {
    return "Invalid Date"
  }
}

// Trend analyzer for coloring logic (returns "up", "down", "neutral")
export const getTrendDirection = (value) => {
  if (value === null || value === undefined) return "neutral"
  if (value > 0) return "up"
  if (value < 0) return "down"
  return "neutral"
}

// Alias — some older components import formatNumber
export const formatNumber = formatCompactNumber
