type Listener = (data: any) => void

class ThreatWS {
	private socket: WebSocket | null = null
	private listeners: Set<Listener> = new Set()

	connect() {
		if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) return
		const proto = location.protocol === 'https:' ? 'wss' : 'ws'
		const url = `${proto}://${location.host}/ws/threats`
		this.socket = new WebSocket(url)
		this.socket.onmessage = (evt) => {
			try {
				const data = JSON.parse(evt.data)
				this.listeners.forEach(l => l(data))
			} catch {}
		}
		this.socket.onclose = () => {
			setTimeout(() => this.connect(), 1000)
		}
	}

	on(fn: Listener) { this.listeners.add(fn) }
	off(fn: Listener) { this.listeners.delete(fn) }
}

export const threatWS = new ThreatWS()
