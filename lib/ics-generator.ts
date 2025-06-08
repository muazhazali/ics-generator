import { EventData } from "./types"

export const generateICS = (eventData: EventData) => {
  const formatDateTime = (date: string, time: string) => {
    const datetime = new Date(`${date}T${time}:00`)
    return datetime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
  }

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Calendar Event Creator//EN
BEGIN:VEVENT
UID:${Date.now()}@calendar-event-creator.com
DTSTART:${formatDateTime(eventData.date, eventData.startTime)}
DTEND:${formatDateTime(eventData.date, eventData.endTime)}
SUMMARY:${eventData.title}
LOCATION:${eventData.location}
DESCRIPTION:${eventData.description}
END:VEVENT
END:VCALENDAR`

  const blob = new Blob([icsContent], { type: "text/calendar" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${eventData.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
} 