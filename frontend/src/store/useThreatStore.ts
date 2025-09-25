import { create } from 'zustand'

type ThreatEvent = {
	type: string
	data: any
	timestamp?: number
}

type State = {
	liveEvents: ThreatEvent[]
	lastResults: Record<string, any>
	addEvent: (e: ThreatEvent) => void
	setLastResult: (key: string, data: any) => void
}

export const useThreatStore = create<State>((set) => ({
	liveEvents: [],
	lastResults: {},
	addEvent: (e) => set(s => ({ liveEvents: [{...e, timestamp: Date.now()}, ...s.liveEvents].slice(0, 100) })),
	setLastResult: (key, data) => set(s => ({ lastResults: { ...s.lastResults, [key]: data } }))
}))
