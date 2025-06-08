"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Calendar, Download, Loader2, CheckCircle, AlertCircle, Type, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface EventData {
  title: string
  date: string
  startTime: string
  endTime: string
  location: string
  description: string
  timezone: string
}

interface ProcessingState {
  status: "idle" | "processing" | "completed" | "error"
  progress: number
  message: string
}

export default function CalendarEventCreator() {
  const [inputMethod, setInputMethod] = useState<"text" | "file">("text")
  const [textInput, setTextInput] = useState<string>("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState<string>("")
  const [eventData, setEventData] = useState<EventData>({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    description: "",
    timezone: "America/New_York",
  })
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: "idle",
    progress: 0,
    message: "",
  })

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    
    // Validate file type
    const { isValidFileType, getFileTypeDescription } = await import("@/lib/fileProcessor")
    
    if (!isValidFileType(file)) {
      setProcessingState({
        status: "error",
        progress: 0,
        message: `Unsupported file type. Please upload a PDF, image, text file, or Word document.`,
      })
      return
    }
    
    setUploadedFile(file)
    setProcessingState({
      status: "idle",
      progress: 0,
      message: `${getFileTypeDescription(file)} ready for processing`,
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "image/*": [".png", ".jpg", ".jpeg", ".heic"],
    },
    maxSize: 25 * 1024 * 1024, // 25MB
    multiple: false,
  })

  const handleExtractInfo = async () => {
    setProcessingState({
      status: "processing",
      progress: 25,
      message: "Processing content...",
    })

    try {
      let contentToProcess = ""

      if (inputMethod === "text") {
        contentToProcess = textInput
      } else if (uploadedFile) {
        // Real file processing using our utility functions
        const { processFile } = await import("@/lib/fileProcessor")
        
        contentToProcess = await processFile(uploadedFile, (progress, message) => {
          setProcessingState({
            status: "processing",
            progress: Math.min(progress, 70), // Reserve 70-100% for AI processing
            message,
          })
        })
      }

      setExtractedText(contentToProcess)
      setProcessingState({
        status: "processing",
        progress: 75,
        message: "Analyzing content with AI to extract event details...",
      })

      // Call our API endpoint
      const response = await fetch('/api/process-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: contentToProcess }),
      })

      if (!response.ok) {
        throw new Error('Failed to process event information')
      }

      const aiExtractedData = await response.json()
      setEventData(aiExtractedData)
      
      setProcessingState({
        status: "completed",
        progress: 100,
        message: "Event details extracted successfully!",
      })
    } catch (error) {
      console.error('Error processing event:', error)
      
      let errorMessage = "Failed to process content. Please try again."
      
      if (error instanceof Error) {
        if (error.message.includes('PDF')) {
          errorMessage = "Failed to extract text from PDF. Please ensure the PDF contains selectable text."
        } else if (error.message.includes('OCR') || error.message.includes('image')) {
          errorMessage = "Failed to extract text from image. Please ensure the image contains clear, readable text."
        } else if (error.message.includes('Unsupported file type')) {
          errorMessage = error.message
        } else if (error.message.includes('Failed to process event')) {
          errorMessage = "AI processing failed. Please check your content and try again."
        }
      }
      
      setProcessingState({
        status: "error",
        progress: 0,
        message: errorMessage,
      })
    }
  }

  const handleInputChange = (field: keyof EventData, value: string) => {
    setEventData((prev) => ({ ...prev, [field]: value }))
  }

  const generateICS = () => {
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

  const resetForm = () => {
    setTextInput("")
    setUploadedFile(null)
    setExtractedText("")
    setEventData({
      title: "",
      date: "",
      startTime: "",
      endTime: "",
      location: "",
      description: "",
      timezone: "America/New_York",
    })
    setProcessingState({
      status: "idle",
      progress: 0,
      message: "",
    })
  }

  const canExtract = (inputMethod === "text" && textInput.trim().length > 0) || (inputMethod === "file" && uploadedFile !== null)

  // Add console logging to debug button state
  console.log('Button state:', {
    inputMethod,
    textInputLength: textInput.trim().length,
    hasUploadedFile: uploadedFile !== null,
    canExtract,
    processingState: processingState.status
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calendar className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Calendar Event Creator</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform any document into calendar events with AI-powered extraction. Type, paste, or upload content to
            get perfectly formatted ICS files in seconds.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Input & Processing */}
          <div className="space-y-6">
            {/* Input Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Add Event Information
                </CardTitle>
                <CardDescription>Type, paste text, or upload a document containing event details</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as "text" | "file")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text" className="flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      Type/Paste Text
                    </TabsTrigger>
                    <TabsTrigger value="file" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload File
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="text" className="mt-4">
                    <div className="space-y-3">
                      <Label htmlFor="textInput">Event Information</Label>
                      <Textarea
                        id="textInput"
                        placeholder="Paste or type your event information here...

Examples: Meeting invitations, event announcements, calendar details, or any text with date, time, and location."
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        rows={12}
                        className="resize-none"
                      />
                      <p className="text-sm text-gray-500">
                        {textInput.length} characters • Supports copy-paste from emails, documents, and web pages
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="file" className="mt-4">
                    <div className="space-y-4">
                      <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <input {...getInputProps()} />
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        {isDragActive ? (
                          <p className="text-blue-600 font-medium">Drop the file here...</p>
                        ) : (
                          <div>
                            <p className="text-gray-600 mb-2">Drag & drop a file here, or click to select</p>
                            <p className="text-sm text-gray-500">PDF, DOCX, TXT, JPG, PNG, HEIC (max 25MB)</p>
                          </div>
                        )}
                      </div>

                      {uploadedFile && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{uploadedFile.name}</p>
                              <p className="text-xs text-gray-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <Badge variant="secondary">
                              {uploadedFile.type.split("/")[1]?.toUpperCase() || "FILE"}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Extract Button */}
                <div className="mt-6 pt-4 border-t">
                  <Button
                    onClick={handleExtractInfo}
                    disabled={!canExtract || processingState.status === "processing"}
                    className="w-full"
                    size="lg"
                  >
                    {processingState.status === "processing" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Extract Event Details
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Processing Status */}
            {processingState.status !== "idle" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {processingState.status === "completed" ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : processingState.status === "error" ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    )}
                    Processing Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>{processingState.message}</span>
                      <span>{processingState.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          processingState.status === "error"
                            ? "bg-red-500"
                            : processingState.status === "completed"
                              ? "bg-green-500"
                              : "bg-blue-500"
                        }`}
                        style={{ width: `${processingState.progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Extracted Text Preview */}
            {extractedText && (
              <Card>
                <CardHeader>
                  <CardTitle>Processed Content</CardTitle>
                  <CardDescription>Content analyzed for event extraction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">{extractedText}</pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Event Details & Export */}
          <div className="space-y-6">
            {/* Event Details Form */}
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
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter event title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={eventData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={eventData.timezone} onValueChange={(value) => handleInputChange("timezone", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={eventData.startTime}
                      onChange={(e) => handleInputChange("startTime", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={eventData.endTime}
                      onChange={(e) => handleInputChange("endTime", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={eventData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Enter event location"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={eventData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Enter event description"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Export Actions */}
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

                  <div className="flex gap-3">
                    <Button
                      onClick={generateICS}
                      disabled={!eventData.title || !eventData.date || !eventData.startTime}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download ICS File
                    </Button>
                    <Button variant="outline" onClick={resetForm}>
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
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Powered by AI • Content is processed securely and not stored •
            <span className="ml-2">Supports text input and file uploads</span>
          </p>
        </div>
      </div>
    </div>
  )
}
