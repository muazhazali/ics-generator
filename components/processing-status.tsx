import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { ProcessingState } from "@/lib/types"

interface ProcessingStatusProps {
  processingState: ProcessingState
}

export function ProcessingStatus({ processingState }: ProcessingStatusProps) {
  if (processingState.status === "idle") return null

  return (
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
  )
} 