import dynamic from 'next/dynamic'

const CalendarEventCreator = dynamic(
  () => import('@/components/calendar-event-creator').then(mod => ({ default: mod.CalendarEventCreator })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ICS Generator...</p>
        </div>
      </div>
    )
  }
)

export default function Page() {
  return <CalendarEventCreator />
}
