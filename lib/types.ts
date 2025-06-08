export interface EventData {
  title: string
  date: string
  startTime: string
  endTime: string
  location: string
  description: string
  timezone: string
}

export interface ProcessingState {
  status: "idle" | "processing" | "completed" | "error"
  progress: number
  message: string
}

export interface TimezoneOption {
  value: string
  label: string
  offset: string
  city: string
}

export type InputMethod = "text" | "file" 