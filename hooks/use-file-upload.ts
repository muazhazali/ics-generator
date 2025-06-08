import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { FILE_UPLOAD_CONFIG } from "@/lib/constants"
import { ProcessingState } from "@/lib/types"

interface UseFileUploadProps {
  onFileAccepted: (file: File) => void
  setProcessingState: (state: ProcessingState) => void
}

export const useFileUpload = ({ onFileAccepted, setProcessingState }: UseFileUploadProps) => {
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
    
    onFileAccepted(file)
    setProcessingState({
      status: "idle",
      progress: 0,
      message: `${getFileTypeDescription(file)} ready for processing`,
    })
  }, [onFileAccepted, setProcessingState])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: FILE_UPLOAD_CONFIG.acceptedTypes,
    maxSize: FILE_UPLOAD_CONFIG.maxSize,
    multiple: false,
  })

  return {
    getRootProps,
    getInputProps,
    isDragActive,
  }
} 