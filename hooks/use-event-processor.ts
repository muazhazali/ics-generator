import { useState, useCallback, useEffect } from "react"
import { EventData, ProcessingState, InputMethod } from "@/lib/types"
import { DEFAULT_TIMEZONE } from "@/lib/constants"

export const useEventProcessor = () => {
  const [inputMethod, setInputMethod] = useState<InputMethod>("text")
  const [textInput, setTextInput] = useState<string>("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState<string>("")
  const [userTimezone, setUserTimezone] = useState<string>(DEFAULT_TIMEZONE)
  const [eventData, setEventData] = useState<EventData>({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    description: "",
    timezone: DEFAULT_TIMEZONE,
  })
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: "idle",
    progress: 0,
    message: "",
  })

  // Detect user's timezone on component mount
  useEffect(() => {
    try {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      setUserTimezone(detectedTimezone)
      setEventData(prev => ({ ...prev, timezone: detectedTimezone }))
    } catch (error) {
      console.warn('Could not detect user timezone:', error)
    }
  }, [])

  const handleInputChange = useCallback((field: keyof EventData, value: string) => {
    setEventData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleExtractInfo = useCallback(async () => {
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
      console.log('AI extracted data:', aiExtractedData)
      console.log('Detected timezone:', aiExtractedData.timezone)
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
  }, [inputMethod, textInput, uploadedFile])

  const resetForm = useCallback(() => {
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
      timezone: userTimezone,
    })
    setProcessingState({
      status: "idle",
      progress: 0,
      message: "",
    })
  }, [userTimezone])

  const canExtract = (inputMethod === "text" && textInput.trim().length > 0) || (inputMethod === "file" && uploadedFile !== null)

  return {
    // State
    inputMethod,
    textInput,
    uploadedFile,
    extractedText,
    userTimezone,
    eventData,
    processingState,
    canExtract,
    
    // Actions
    setInputMethod,
    setTextInput,
    setUploadedFile,
    setProcessingState,
    handleInputChange,
    handleExtractInfo,
    resetForm,
  }
} 