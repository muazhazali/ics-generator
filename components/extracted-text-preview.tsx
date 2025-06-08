import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ExtractedTextPreviewProps {
  extractedText: string
}

export function ExtractedTextPreview({ extractedText }: ExtractedTextPreviewProps) {
  if (!extractedText) return null

  return (
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
  )
} 