"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Type, Sparkles, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { InputMethod, ProcessingState } from "@/lib/types"
import { useFileUpload } from "@/hooks/use-file-upload"

interface InputSectionProps {
  inputMethod: InputMethod
  setInputMethod: (method: InputMethod) => void
  textInput: string
  setTextInput: (text: string) => void
  uploadedFile: File | null
  setUploadedFile: (file: File | null) => void
  processingState: ProcessingState
  setProcessingState: (state: ProcessingState) => void
  canExtract: boolean
  onExtractInfo: () => void
}

export function InputSection({
  inputMethod,
  setInputMethod,
  textInput,
  setTextInput,
  uploadedFile,
  setUploadedFile,
  processingState,
  setProcessingState,
  canExtract,
  onExtractInfo,
}: InputSectionProps) {
  const { getRootProps, getInputProps, isDragActive } = useFileUpload({
    onFileAccepted: setUploadedFile,
    setProcessingState,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          Add Event Information
        </CardTitle>
        <CardDescription>Type, paste text, or upload a document containing event details</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as InputMethod)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Type className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Type/Paste Text</span>
              <span className="sm:hidden">Text</span>
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Upload File</span>
              <span className="sm:hidden">File</span>
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
                rows={8}
                className="resize-none text-sm"
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
                className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input {...getInputProps()} />
                <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2 sm:mb-4" />
                {isDragActive ? (
                  <p className="text-blue-600 font-medium text-sm sm:text-base">Drop the file here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-1 sm:mb-2 text-sm sm:text-base">Drag & drop a file here, or click to select</p>
                    <p className="text-xs sm:text-sm text-gray-500">PDF, DOCX, TXT, JPG, PNG, HEIC (max 25MB)</p>
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
            onClick={onExtractInfo}
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
  )
} 