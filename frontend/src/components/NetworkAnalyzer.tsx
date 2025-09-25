import { useState } from 'react'
import { api } from '../services/api'
import { Spinner } from './ui/Spinner'
import { useToast } from './ui/Toast'

export default function NetworkAnalyzer() {
	const [result, setResult] = useState<any | null>(null)
	const [loading, setLoading] = useState(false)
    const { show } = useToast()

	const run = async () => {
		setLoading(true)
        try {
            const data = await api.scanNetwork()
            setResult(data)
            show('Network scan complete')
        } catch (e) {
            show('Network scan failed', 'error')
        } finally { setLoading(false) }
	}

	return (
		<div className="space-y-3">
            <button className="btn-primary" onClick={run} disabled={loading}>{loading ? (<span className="inline-flex items-center gap-2"><Spinner size={16} /> Scanning...</span>) : 'Scan Network'}</button>
			{result && (
				<pre className="code-block">{JSON.stringify(result, null, 2)}</pre>
			)}
		</div>
	)
}
