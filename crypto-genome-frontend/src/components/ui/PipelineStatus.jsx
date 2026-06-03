import { Activity, Database, Server, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"

const services = [
  { id: "api", name: "FastAPI Backend", icon: Server },
  { id: "ws", name: "WebSocket Server", icon: Activity },
  { id: "db", name: "PostgreSQL DB", icon: Database },
  { id: "stream", name: "Data Pipeline", icon: RefreshCw },
]

export default function PipelineStatus({ metrics, isConnected }) {
  const isHealthy = metrics?.system_health === "healthy"

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {services.map((service, index) => {
        const Icon = service.icon
        // Mock status logic based on overall health & connection
        const status = isConnected 
          ? (isHealthy ? "operational" : "degraded")
          : "disconnected"

        const colorMap = {
          operational: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
          degraded: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
          disconnected: "text-red-400 bg-red-400/10 border-red-400/30"
        }

        return (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl border flex flex-col gap-3 ${colorMap[status]}`}
          >
            <div className="flex justify-between items-start">
              <Icon size={20} className="opacity-80" />
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  status === "operational" ? "bg-emerald-400 animate-pulse" :
                  status === "degraded" ? "bg-yellow-400" : "bg-red-400"
                }`} />
              </div>
            </div>
            
            <div>
              <div className="font-mono text-sm opacity-80 uppercase tracking-wider">
                {service.name}
              </div>
              <div className="font-bold capitalize text-lg mt-1">
                {status}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
