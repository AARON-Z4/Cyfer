import axios from 'axios'

const client = axios.create({
	baseURL: '/api',
	withCredentials: false,
})

export const api = {
	scanUrl: (url: string) => client.post('/scan/url', { url }).then(r => r.data),
	scanDevice: () => client.post('/scan/device').then(r => r.data),
	scanNetwork: () => client.post('/scan/network').then(r => r.data),
	scanFile: (file: File) => {
		const formData = new FormData()
		formData.append('file', file)
		return client.post('/scan/file', formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		}).then(r => r.data)
	},
	agentsStatus: () => client.get('/agents/status').then(r => r.data),
}
