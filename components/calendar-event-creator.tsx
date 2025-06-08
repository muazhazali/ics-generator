"use client"

import { Calendar } from "lucide-react"
import { useEventProcessor } from "@/hooks/use-event-processor"
import { InputSection } from "@/components/input-section"
import { ProcessingStatus } from "@/components/processing-status"
import { ExtractedTextPreview } from "@/components/extracted-text-preview"
import { EventDetailsForm } from "@/components/event-details-form"
import { ExportSection } from "@/components/export-section"
import { AppFooter } from "@/components/app-footer"

export function CalendarEventCreator() {
  const {
    // State
    inputMethod,
    textInput,
    uploadedFile,
    extractedText,
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
  } = useEventProcessor()

  // Add console logging to debug button state
  console.log('Button state:', {
    inputMethod,
    textInputLength: textInput.trim().length,
    hasUploadedFile: uploadedFile !== null,
    canExtract,
    processingState: processingState.status
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-2 sm:mb-4">
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">ICS Generator</h1>
          </div>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-2">
            Transform any document into calendar events with AI-powered extraction. Type, paste, or upload content to
            get perfectly formatted ICS files in seconds.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-3 sm:gap-6">
          {/* Left Column - Input & Processing */}
          <div className="space-y-3 sm:space-y-6">
            <InputSection
              inputMethod={inputMethod}
              setInputMethod={setInputMethod}
              textInput={textInput}
              setTextInput={setTextInput}
              uploadedFile={uploadedFile}
              setUploadedFile={setUploadedFile}
              processingState={processingState}
              setProcessingState={setProcessingState}
              canExtract={canExtract}
              onExtractInfo={handleExtractInfo}
            />

            <ProcessingStatus processingState={processingState} />

            <ExtractedTextPreview extractedText={extractedText} />
          </div>

          {/* Right Column - Event Details & Export */}
          <div className="space-y-3 sm:space-y-6">
            <EventDetailsForm
              eventData={eventData}
              onInputChange={handleInputChange}
            />

            <ExportSection
              eventData={eventData}
              processingState={processingState}
              onReset={resetForm}
            />
          </div>
        </div>

        <AppFooter />
      </div>
    </div>
  )
} 