import { useState } from 'react'
import { api } from '../services/api'

export default function NetworkAnalyzer() {
	const [result, setResult] = useState<any | null>(null)
	const [loading, setLoading] = useState(false)

	const run = async () => {
		setLoading(true)
		try { setResult(await api.scanNetwork()) } finally { setLoading(false) }
	}

	return (
		<div className="space-y-3">
			<button className="px-3 py-1 bg-indigo-600 rounded" onClick={run} disabled={loading}>Scan Network</button>
			{result && (
				<pre className="bg-gray-900 border border-gray-800 p-3 rounded text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
			)}
		</div>
	)
}
