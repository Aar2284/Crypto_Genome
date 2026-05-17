import { Routes, Route } from "react-router-dom"
import Layout from "./components/layout/Layout.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import Analytics from "./pages/Analytics.jsx"
import PipelineMonitor from "./pages/PipelineMonitor.jsx"
import SystemMetrics from "./pages/SystemMetrics.jsx"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="pipeline" element={<PipelineMonitor />} />
        <Route path="metrics" element={<SystemMetrics />} />
      </Route>
    </Routes>
  )
}
