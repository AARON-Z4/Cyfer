type Listener = (data: any) => void

class ThreatWS {
	private socket: WebSocket | null = null
	private listeners: Set<Listener> = new Set()
    private heartbeatTimer: any = null
    private lastPong: number = 0

	connect() {
		if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) return
		const proto = location.protocol === 'https:' ? 'wss' : 'ws'
		const url = `${proto}://${location.host}/ws/threats`
		this.socket = new WebSocket(url)
		this.socket.onmessage = (evt) => {
			try {
				const data = JSON.parse(evt.data)
                if (data?.type === 'heartbeat') {
                    this.lastPong = Date.now()
                    return
                }
				this.listeners.forEach(l => l(data))
			} catch {}
		}
		this.socket.onclose = () => {
			setTimeout(() => this.connect(), 1000)
		}
        this.socket.onopen = () => {
            this.lastPong = Date.now()
            clearInterval(this.heartbeatTimer)
            this.heartbeatTimer = setInterval(() => {
                try {
                    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return
                    this.socket.send(JSON.stringify({ type: 'ping', ts: Date.now() }))
                    // If no pong/heartbeat for 20s, reconnect
                    if (Date.now() - this.lastPong > 20000) {
                        this.socket.close()
                    }
                } catch {}
            }, 5000)
        }
	}

	on(fn: Listener) { this.listeners.add(fn) }
	off(fn: Listener) { this.listeners.delete(fn) }
}

export const threatWS = new ThreatWS()
