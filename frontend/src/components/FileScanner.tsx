import { useState } from 'react'
import { api } from '../services/api'
import { Spinner } from './ui/Spinner'
import { useToast } from './ui/Toast'

export default function FileScanner() {
	const [file, setFile] = useState<File | null>(null)
	const [result, setResult] = useState<any | null>(null)
	const [loading, setLoading] = useState(false)
    const { show } = useToast()

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFile(e.target.files?.[0] ?? null)
	}

	const run = async () => {
		if (!file) return
		setLoading(true)
        try {
            const data = await api.scanFile(file)
            setResult(data)
            show('File scan complete')
        } catch (e) {
            show('File scan failed', 'error')
        } finally { setLoading(false) }
	}

	return (
		<div className="space-y-3">
			<input type="file" onChange={onChange} className="block input" />
            <button className="btn-primary" onClick={run} disabled={!file || loading}>{loading ? (<span className="inline-flex items-center gap-2"><Spinner size={16} /> Scanning...</span>) : 'Scan File'}</button>
			{result && (
				<pre className="code-block">{JSON.stringify(result, null, 2)}</pre>
			)}
		</div>
	)
}
