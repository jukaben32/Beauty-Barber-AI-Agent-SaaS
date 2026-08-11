import { create } from 'zustand'

export interface VoiceMessage {
  id: string
  role: 'agent' | 'caller' | 'system'
  content: string
  createdAt: string
}

interface VoiceStoreState {
  status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'
  session: Record<string, unknown> | null
  transcript: string
  messages: VoiceMessage[]
  error: string | null
  setStatus: (status: VoiceStoreState['status']) => void
  setSession: (session: Record<string, unknown> | null) => void
  setTranscript: (transcript: string) => void
  appendMessage: (message: VoiceMessage) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useVoiceStore = create<VoiceStoreState>((set) => ({
  status: 'idle',
  session: null,
  transcript: '',
  messages: [],
  error: null,
  setStatus: (status) => set({ status }),
  setSession: (session) => set({ session }),
  setTranscript: (transcript) => set({ transcript }),
  appendMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      status: 'idle',
      session: null,
      transcript: '',
      messages: [],
      error: null,
    }),
}))

export default useVoiceStore
