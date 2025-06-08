import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "lucide-react"
import { EventData } from "@/lib/types"
import { TimezoneSelector } from "./timezone-selector"

interface EventDetailsFormProps {
  eventData: EventData
  onInputChange: (field: keyof EventData, value: string) => void
}

export function EventDetailsForm({ eventData, onInputChange }: EventDetailsFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Event Details
        </CardTitle>
        <CardDescription>Review and edit the extracted event information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">Event Title *</Label>
          <Input
            id="title"
            value={eventData.title}
            onChange={(e) => onInputChange("title", e.target.value)}
            placeholder="Enter event title"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={eventData.date}
              onChange={(e) => onInputChange("date", e.target.value)}
            />
          </div>
          <div>
            <TimezoneSelector
              value={eventData.timezone}
              onChange={(timezone) => onInputChange("timezone", timezone)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startTime">Start Time *</Label>
            <Input
              id="startTime"
              type="time"
              value={eventData.startTime}
              onChange={(e) => onInputChange("startTime", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="endTime">End Time *</Label>
            <Input
              id="endTime"
              type="time"
              value={eventData.endTime}
              onChange={(e) => onInputChange("endTime", e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={eventData.location}
            onChange={(e) => onInputChange("location", e.target.value)}
            placeholder="Enter event location"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={eventData.description}
            onChange={(e) => onInputChange("description", e.target.value)}
            placeholder="Enter event description"
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  )
} 