import { useState } from 'react'
import { api } from '../services/api'

export default function FileScanner() {
	const [file, setFile] = useState<File | null>(null)
	const [result, setResult] = useState<any | null>(null)
	const [loading, setLoading] = useState(false)

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFile(e.target.files?.[0] ?? null)
	}

	const run = async () => {
		if (!file) return
		setLoading(true)
		try { setResult(await api.scanFile(file)) } finally { setLoading(false) }
	}

	return (
		<div className="space-y-3">
			<input type="file" onChange={onChange} className="block" />
			<button className="px-3 py-1 bg-indigo-600 rounded" onClick={run} disabled={!file || loading}>Scan File</button>
			{result && (
				<pre className="bg-gray-900 border border-gray-800 p-3 rounded text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
			)}
		</div>
	)
}
