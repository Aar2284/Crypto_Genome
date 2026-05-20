export const WS_STATES = {
  IDLE: "idle",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
  DISCONNECTED: "disconnected",
  FAILED: "failed"
}

export class WebSocketClient {
  constructor(url) {
    this.url = url
    this.ws = null
    this.state = WS_STATES.IDLE
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.reconnectTimer = null
    this.intentionalDisconnect = false
    this.lastLatencyMs = 0

    // Callbacks
    this.onMessageHandlers = new Set()
    this.onStateChangeHandlers = new Set()

    // Burst protection
    this.pendingUpdates = []
    this.throttleTimer = null
    this.throttleMs = 500 // Batch updates every 500ms max to prevent UI thrashing
  }

  connect() {
    if (this.state === WS_STATES.CONNECTED || this.state === WS_STATES.CONNECTING) return

    this.intentionalDisconnect = false
    this.setState(this.reconnectAttempts > 0 ? WS_STATES.RECONNECTING : WS_STATES.CONNECTING)

    try {
      this.ws = new WebSocket(this.url)
      
      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onclose = this.handleClose.bind(this)
      this.ws.onerror = this.handleError.bind(this)
    } catch (e) {
      console.error("[WebSocket] connection instantiation failed", e)
      this.handleClose()
    }
  }

  disconnect() {
    this.intentionalDisconnect = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.throttleTimer) clearTimeout(this.throttleTimer)
    
    this.pendingUpdates = []
    this.reconnectAttempts = 0

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.setState(WS_STATES.DISCONNECTED)
  }

  setState(newState) {
    if (this.state !== newState) {
      this.state = newState
      this.onStateChangeHandlers.forEach(cb => cb(newState, this.reconnectAttempts))
    }
  }

  handleOpen() {
    this.reconnectAttempts = 0
    this.setState(WS_STATES.CONNECTED)
  }

  handleMessage(event) {
    try {
      const msg = JSON.parse(event.data)
      
      // Payload validation
      if (msg.type !== "price_update" || !Array.isArray(msg.data) || !msg.server_time) {
        console.warn("[WebSocket] Dropping malformed or unknown packet", msg)
        return
      }

      // Calculate pseudo-latency (assuming clocks are roughly synced, just for diagnostic metrics)
      const serverTime = new Date(msg.server_time).getTime()
      const now = Date.now()
      this.lastLatencyMs = Math.max(0, now - serverTime) // Prevents negative drift

      // Queue for throttled flush
      this.pendingUpdates.push(...msg.data)
      this.scheduleFlush()

    } catch (e) {
      console.error("[WebSocket] Failed to parse message", e)
    }
  }

  scheduleFlush() {
    if (this.throttleTimer) return

    this.throttleTimer = setTimeout(() => {
      this.throttleTimer = null
      
      if (this.pendingUpdates.length > 0) {
        // Resolve duplicates by keeping the most recent (last) update per coin
        const batched = Array.from(new Map(this.pendingUpdates.map(u => [u.symbol, u])).values())
        
        this.onMessageHandlers.forEach(cb => cb({ 
          type: "price_update", 
          data: batched, 
          latency: this.lastLatencyMs 
        }))
        
        this.pendingUpdates = []
      }
    }, this.throttleMs)
  }

  handleClose() {
    if (this.ws) {
      this.ws.onopen = null
      this.ws.onmessage = null
      this.ws.onclose = null
      this.ws.onerror = null
      this.ws = null
    }

    if (this.intentionalDisconnect) {
      this.setState(WS_STATES.DISCONNECTED)
      return
    }

    this.scheduleReconnect()
  }

  handleError(err) {
    console.error("[WebSocket] Socket error", err)
    // onerror is usually followed by onclose, so logic stays in onclose
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setState(WS_STATES.FAILED)
      return
    }

    this.reconnectAttempts++
    // Exponential backoff capped at 16 seconds: 1s, 2s, 4s, 8s, 16s
    const backoffSeconds = Math.min(Math.pow(2, this.reconnectAttempts - 1), 16)
    
    this.setState(WS_STATES.RECONNECTING)
    console.log(`[WebSocket] Reconnecting in ${backoffSeconds}s (Attempt ${this.reconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, backoffSeconds * 1000)
  }

  onMessage(cb) {
    this.onMessageHandlers.add(cb)
    return () => this.onMessageHandlers.delete(cb)
  }

  onStateChange(cb) {
    this.onStateChangeHandlers.add(cb)
    return () => this.onStateChangeHandlers.delete(cb)
  }
}

// Singleton instance
const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/live"
export const liveStream = new WebSocketClient(WS_URL)
