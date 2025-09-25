export default function ThreatIntelligence() {
	const advisories = [
		{ id: 'CVE-2024-12345', severity: 'high', title: 'Mock RCE in demo component' },
		{ id: 'CVE-2025-00001', severity: 'medium', title: 'Mock XSS issue' },
	]
	return (
		<div className="space-y-3">
			{advisories.map(a => (
				<div key={a.id} className="border border-gray-800 rounded p-3 bg-gray-900/40">
					<div className="text-sm text-gray-400">{a.id}</div>
					<div className="flex items-center gap-2">
						<span className={`inline-block w-2 h-2 rounded-full ${a.severity === 'high' ? 'bg-red-500' : a.severity === 'medium' ? 'bg-yellow-400' : 'bg-green-500'}`}></span>
						<div className="font-medium">{a.title}</div>
					</div>
				</div>
			))}
		</div>
	)
}
