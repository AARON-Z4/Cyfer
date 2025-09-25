import { useState } from 'react'
import { api } from '../services/api'
import { useThreatStore } from '../store/useThreatStore'

export default function URLScanner() {
	const [url, setUrl] = useState('')
	const setLast = useThreatStore(s => s.setLastResult)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const submit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError(null)
		try {
			const data = await api.scanUrl(url)
			setLast('url', data)
		} catch (e: any) {
			setError(e?.message ?? 'Failed to scan URL')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="max-w-xl space-y-4">
			<form onSubmit={submit} className="flex gap-2">
				<input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://example.com" className="flex-1 px-3 py-2 rounded bg-gray-900 border border-gray-800" />
				<button disabled={loading} className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-500 disabled:opacity-50">Scan</button>
			</form>
			{error && <div className="text-sm text-red-400">{error}</div>}
		</div>
	)
}
