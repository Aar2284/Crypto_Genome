import { useEffect } from "react"
import { Routes, Route } from "react-router-dom"
import Layout from "./components/layout/Layout.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import Analytics from "./pages/Analytics.jsx"
import PipelineMonitor from "./pages/PipelineMonitor.jsx"
import SystemMetrics from "./pages/SystemMetrics.jsx"
import { useLiveData } from "./hooks/useLiveData.js"
import useCryptoStore from "./store/useCryptoStore.js"

function AppBootstrap() {
  const fetchAll = useCryptoStore((s) => s.fetchAll)

  // Initial data load (also sets up mock data immediately)
  useEffect(() => {
    const controller = new AbortController()
    fetchAll(controller.signal)

    // Background refresh every 30 seconds
    const timer = setInterval(() => {
      const ac = new AbortController()
      fetchAll(ac.signal)
    }, 30_000)

    return () => {
      controller.abort()
      clearInterval(timer)
    }
  }, [fetchAll])

  // Try to connect to live WebSocket (silently falls back to mock)
  useLiveData(true)

  return null
}

export default function App() {
  return (
    <>
      <AppBootstrap />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="pipeline" element={<PipelineMonitor />} />
          <Route path="metrics" element={<SystemMetrics />} />
        </Route>
      </Routes>
    </>
  )
}
