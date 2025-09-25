import { useEffect, useMemo, useState } from 'react'
import { useThreatStore } from '../store/useThreatStore'
import { threatWS } from '../services/ws'
import { api } from '../services/api'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function ThreatDashboard() {
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
						<div key={i} className="px-3 py-2 bg-red-600/20 border border-red-700 text-red-200 rounded text-sm">{a}</div>
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
								<div className="w-full h-2 bg-gray-800 rounded">
									<div className="h-2 bg-indigo-500 rounded" style={{ width: `${pct}%` }}></div>
								</div>
							</div>
						))}
					</div>
				</Card>
				<Card title="Recent Events">
					<ul className="text-sm max-h-48 overflow-auto divide-y divide-gray-800">
						{events.slice(0, 10).map((e, idx) => (
							<li key={idx} className="py-2">
								<span className={`inline-block w-2 h-2 rounded-full mr-2 ${sevColor(e?.data?.threat_level)}`}></span>
								{e.type} {e?.agent ? `(${e.agent})` : ''} {e?.percent !== undefined ? `- ${e.percent}%` : ''}
							</li>
						))}
					</ul>
				</Card>
			</div>
		</div>
	)
}

function Card({ title, children }: { title: string, children: any }) {
	return (
		<div className="border border-gray-800 rounded-md p-4 bg-gray-900/40">
			<h2 className="text-sm font-medium mb-2 text-gray-300">{title}</h2>
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
