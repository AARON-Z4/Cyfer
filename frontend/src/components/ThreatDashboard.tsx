import { memo, useEffect, useMemo, useState } from 'react'
import { useThreatStore } from '../store/useThreatStore'
import { threatWS } from '../services/ws'
import { api } from '../services/api'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function ThreatDashboardImpl() {
	const events = useThreatStore(s => s.liveEvents)
	const addEvent = useThreatStore(s => s.addEvent)
	const [progress, setProgress] = useState<Record<string, number>>({})
	const [alerts, setAlerts] = useState<string[]>([])

	useEffect(() => {
		threatWS.connect()
		const handler = (msg: any) => {
			if (msg?.type === 'progress' && msg?.agent) {
				setProgress(p => ({ ...p, [msg.agent]: msg.percent }))
			}
			if ((msg?.type?.endsWith('_scan') || msg?.type === 'vuln_scan') && msg?.data?.threat_level === 'high') {
				setAlerts(a => [ `${msg.type} HIGH`, ...a].slice(0, 5))
			}
			addEvent(msg)
		}
		threatWS.on(handler)
		return () => threatWS.off(handler)
	}, [addEvent])

	const chartData = events.slice(0, 20).map((e, i) => ({ idx: 20 - i, sev: sevScore(e?.data?.threat_level) }))

	return (
		<div className="space-y-6">
			{alerts.length > 0 && (
				<div className="space-y-1">
					{alerts.map((a, i) => (
						<div key={i} className="alert-danger">{a}</div>
					))}
				</div>
			)}
			<div className="grid grid-cols-3 gap-4">
				<Card title="Live Threat Level">
					<div className="h-48">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={chartData}>
								<XAxis dataKey="idx" hide />
								<YAxis domain={[0, 3]} tickFormatter={sevName} />
								<Tooltip formatter={(v) => sevName(Number(v))} />
								<Line type="monotone" dataKey="sev" stroke="#f87171" strokeWidth={2} dot={false} />
							</LineChart>
						</ResponsiveContainer>
					</div>
				</Card>
                <Card title="Active Scans">
						<div className="space-y-2">
						{Object.entries(progress).map(([agent, pct]) => (
							<div key={agent}>
								<div className="text-xs text-gray-400 mb-1">{agent}</div>
									<div className="progress">
										<div className="progress-bar" style={{ width: `${pct}%` }}></div>
									</div>
							</div>
						))}
					</div>
				</Card>
                <Card title="Recent Events">
                    <VirtualEventList events={events} />
				</Card>
			</div>
		</div>
	)
}

export default memo(ThreatDashboardImpl)

function Card({ title, children }: { title: string, children: any }) {
	return (
		<div className="card">
			<h2 className="card-title">{title}</h2>
			{children}
		</div>
	)
}

function Button({ children, ...props }: any) {
	return <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-sm" {...props}>{children}</button>
}

function sevScore(level?: string) {
	switch(level) {
		case 'low': return 1
		case 'medium': return 2
		case 'high': return 3
		default: return 0
	}
}

function sevName(n: number) {
	return ['none','low','medium','high'][n] ?? 'none'
}

function sevColor(level?: string) {
	return level === 'high' ? 'bg-red-500' : level === 'medium' ? 'bg-yellow-400' : 'bg-green-500'
}

function VirtualEventList({ events }: { events: any[] }) {
    const itemHeight = 40
    const containerHeight = 200
    const count = events.length
    const [scrollTop, setScrollTop] = useState(0)
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 3)
    const endIndex = Math.min(count, startIndex + Math.ceil(containerHeight / itemHeight) + 6)
    const visible = events.slice(startIndex, endIndex)
    const topPadding = startIndex * itemHeight
    const bottomPadding = Math.max(0, (count - endIndex) * itemHeight)
    return (
        <div className="text-sm overflow-auto divide-y divide-gray-800" style={{ height: `${containerHeight}px` }} onScroll={e => setScrollTop((e.target as HTMLDivElement).scrollTop)}>
            <div style={{ paddingTop: `${topPadding}px`, paddingBottom: `${bottomPadding}px` }}>
                {visible.map((e, idx) => (
                    <div key={idx} className="py-2 flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${sevColor(e?.data?.threat_level)}`}></span>
                        {e.type} {e?.agent ? `(${e.agent})` : ''} {e?.percent !== undefined ? `- ${e.percent}%` : ''}
                    </div>
                ))}
            </div>
        </div>
    )
}
