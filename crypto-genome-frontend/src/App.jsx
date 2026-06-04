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
  const initWithMockData = useCryptoStore((s) => s.initWithMockData)

  useEffect(() => {
    // Immediately load mock data — zero network requests
    // Real data will replace this automatically when WebSocket connects
    initWithMockData()
  }, [initWithMockData])

  // Start WebSocket — triggers fetchAll() only if backend is alive
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
