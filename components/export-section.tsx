import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, CheckCircle } from "lucide-react"
import { EventData, ProcessingState } from "@/lib/types"
import { generateICS } from "@/lib/ics-generator"

interface ExportSectionProps {
  eventData: EventData
  processingState: ProcessingState
  onReset: () => void
}

export function ExportSection({ eventData, processingState, onReset }: ExportSectionProps) {
  const handleGenerateICS = () => {
    generateICS(eventData)
  }

  const canExport = eventData.title && eventData.date && eventData.startTime

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Calendar Event</CardTitle>
        <CardDescription>Generate and download your ICS calendar file</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {processingState.status === "completed" && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Event details have been successfully extracted and are ready for export.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleGenerateICS}
              disabled={!canExport}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download ICS File
            </Button>
            <Button variant="outline" onClick={onReset} className="sm:w-auto">
              Reset
            </Button>
          </div>

          <Separator />

          <div className="text-sm text-gray-600">
            <p className="font-medium mb-2">What happens next:</p>
            <ul className="space-y-1 text-sm">
              <li>• Download the ICS file to your device</li>
              <li>• Open with your calendar app (Google, Outlook, Apple)</li>
              <li>• The event will be added to your calendar</li>
              <li>• Share the file with others to add to their calendars</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}