import { VoiceWidget } from '@/components/voice/VoiceWidget'

export default function WidgetTestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-4xl p-8">
        <h1 className="mb-6 text-2xl font-bold">Voice Widget Test</h1>
        <p className="mb-4 text-sm text-gray-600">
          Business slug: antonio-musa (demo business)
        </p>
        <VoiceWidget
          businessSlug="antonio-musa"
          position="bottom-right"
          theme="light"
          primaryColor="#0f766e"
          secondaryColor="#14b8a6"
        />
      </div>
    </div>
  )
}
