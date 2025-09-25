import { useEffect, useState } from 'react'
import { api } from '../services/api'

export default function AgentStatus() {
	const [data, setData] = useState<any | null>(null)
	useEffect(() => { api.agentsStatus().then(setData) }, [])
	return (
		<div>
			<pre className="bg-gray-900 border border-gray-800 p-3 rounded text-sm overflow-auto">{JSON.stringify(data, null, 2)}</pre>
		</div>
	)
}
