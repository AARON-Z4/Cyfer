import { Routes, Route, Link, NavLink } from 'react-router-dom'
import ThreatDashboard from '../components/ThreatDashboard'
import URLScanner from '../components/URLScanner'
import DeviceMonitor from '../components/DeviceMonitor'
import NetworkAnalyzer from '../components/NetworkAnalyzer'
import FileScanner from '../components/FileScanner'
import AgentStatus from '../components/AgentStatus'
import ThreatIntelligence from '../components/ThreatIntelligence'

export default function App() {
	return (
		<div className="min-h-screen grid grid-cols-12">
			<aside className="col-span-2 border-r border-gray-800 p-4 space-y-2">
				<h1 className="text-lg font-semibold">AI Threat Detector</h1>
				<nav className="flex flex-col gap-1">
					<NavLink to="/" end className={({isActive}) => `px-2 py-1 rounded ${isActive ? 'bg-gray-800' : 'hover:bg-gray-900'}`}>Dashboard</NavLink>
					<NavLink to="/url" className={({isActive}) => `px-2 py-1 rounded ${isActive ? 'bg-gray-800' : 'hover:bg-gray-900'}`}>URL Scanner</NavLink>
					<NavLink to="/device" className={({isActive}) => `px-2 py-1 rounded ${isActive ? 'bg-gray-800' : 'hover:bg-gray-900'}`}>Device Monitor</NavLink>
					<NavLink to="/network" className={({isActive}) => `px-2 py-1 rounded ${isActive ? 'bg-gray-800' : 'hover:bg-gray-900'}`}>Network Analyzer</NavLink>
					<NavLink to="/file" className={({isActive}) => `px-2 py-1 rounded ${isActive ? 'bg-gray-800' : 'hover:bg-gray-900'}`}>File Scanner</NavLink>
					<NavLink to="/agents" className={({isActive}) => `px-2 py-1 rounded ${isActive ? 'bg-gray-800' : 'hover:bg-gray-900'}`}>Agents</NavLink>
					<NavLink to="/intel" className={({isActive}) => `px-2 py-1 rounded ${isActive ? 'bg-gray-800' : 'hover:bg-gray-900'}`}>Threat Intel</NavLink>
				</nav>
			</aside>
			<main className="col-span-10 p-6">
				<Routes>
					<Route path="/" element={<ThreatDashboard />} />
					<Route path="/url" element={<URLScanner />} />
					<Route path="/device" element={<DeviceMonitor />} />
					<Route path="/network" element={<NetworkAnalyzer />} />
					<Route path="/file" element={<FileScanner />} />
					<Route path="/agents" element={<AgentStatus />} />
					<Route path="/intel" element={<ThreatIntelligence />} />
				</Routes>
			</main>
		</div>
	)
}
