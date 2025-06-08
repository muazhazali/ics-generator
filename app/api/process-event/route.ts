import { NextResponse } from 'next/server'
import Cerebras from '@cerebras/cerebras_cloud_sdk'

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY

// Initialize Cerebras client
const cerebras = CEREBRAS_API_KEY ? new Cerebras({
  apiKey: CEREBRAS_API_KEY,
}) : null

// Timeout and retry configuration
const MAX_RETRIES = 2

export async function POST(request: Request) {
  try {
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    console.log('Processing content:', content.substring(0, 100) + '...')

    // Try AI processing first, with fallback to local processing
    let eventData
    
    if (cerebras) {
      try {
        eventData = await processWithAI(content)
        console.log('Successfully processed with AI:', eventData)
      } catch (error) {
        console.warn('AI processing failed, falling back to local processing:', error)
        eventData = processLocally(content)
      }
    } else {
      console.log('No API key configured, using local processing')
      eventData = processLocally(content)
    }

    // Validate the extracted data
    if (!eventData.title && !eventData.date) {
      console.error('No meaningful event information could be extracted')
      return NextResponse.json(
        { error: 'Could not extract event information from the provided content' },
        { status: 400 }
      )
    }

    // Fill in default values for missing required fields
    const processedData = {
      title: eventData.title || 'Untitled Event',
      date: eventData.date || new Date().toISOString().split('T')[0],
      startTime: eventData.startTime || '09:00',
      endTime: eventData.endTime || '10:00',
      location: eventData.location || '',
      description: eventData.description || '',
      timezone: 'America/New_York'
    }

    return NextResponse.json(processedData)
  } catch (error) {
    console.error('Error processing event:', error)
    return NextResponse.json(
      { error: 'Failed to process event information' },
      { status: 500 }
    )
  }
}

async function processWithAI(content: string, retryCount = 0): Promise<any> {
  if (!cerebras) {
    throw new Error('Cerebras client not initialized')
  }

  try {
    const chatCompletion = await cerebras.chat.completions.create({
      model: 'llama3.1-8b',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that extracts event information from text. 
          Extract the following information if available:
          - Event title
          - Date (in YYYY-MM-DD format)
          - Start time (in HH:MM format, 24-hour format)
          - End time (in HH:MM format, 24-hour format)
          - Location
          - Description (any relevant information about the event)
          
          Return ONLY a valid JSON object with these exact keys:
          {
            "title": "string",
            "date": "YYYY-MM-DD",
            "startTime": "HH:MM",
            "endTime": "HH:MM",
            "location": "string",
            "description": "string"
          }
          
          If you cannot find specific information, use empty strings for missing fields.`
        },
        {
          role: 'user',
          content: content
        }
      ],
      temperature: 0.1,
      max_completion_tokens: 300,
      response_format: { type: "json_object" }
    })

    console.log('Cerebras API response:', chatCompletion)
    
    // Parse the AI response to extract event details
    const choices = chatCompletion.choices as any[]
    const aiResponse = choices?.[0]?.message?.content
    
    if (!aiResponse) {
      throw new Error('No response content from AI')
    }
    
    let eventData
    try {
      // Try to parse as JSON first
      eventData = JSON.parse(aiResponse)
    } catch (e) {
      // If not valid JSON, try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          eventData = JSON.parse(jsonMatch[0])
        } catch (e2) {
          throw new Error('Could not parse AI response as JSON')
        }
      } else {
        throw new Error('No JSON found in AI response')
      }
    }

    return eventData
  } catch (error) {
    // Handle different types of errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    
    console.error('AI processing error:', { name: errorName, message: errorMessage })
    
    // Retry logic for specific error types (based on Cerebras SDK error types)
    if (retryCount < MAX_RETRIES && (
      errorName === 'APIConnectionError' || 
      errorName === 'APITimeoutError' ||
      errorName === 'RateLimitError' ||
      errorName === 'InternalServerError' ||
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('network')
    )) {
      console.log(`Retrying AI processing (attempt ${retryCount + 1}/${MAX_RETRIES})`)
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // Exponential backoff
      return processWithAI(content, retryCount + 1)
    }
    
    throw error
  }
}

function processLocally(content: string): any {
  console.log('Processing locally with regex patterns')
  
  const eventData = {
    title: extractTitle(content),
    date: extractDate(content),
    startTime: extractTime(content, 'start'),
    endTime: extractTime(content, 'end'),
    location: extractLocation(content),
    description: extractDescription(content)
  }

  console.log('Local processing result:', eventData)
  return eventData
}

// Enhanced helper functions to extract information from text
function extractTitle(text: string): string {
  // Try multiple patterns for title extraction
  const patterns = [
    /(?:title|event|subject|meeting):\s*([^\n\r]+)/i,
    /^([^\n\r]+(?:meeting|event|conference|workshop|seminar|party|celebration))/im,
    /([^\n\r]*(?:meetup|gathering|session|presentation|training))/i,
    /^([A-Z][^\n\r]{10,80})/m // Capitalized line that looks like a title
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const title = match[1].trim().replace(/[^\w\s\-&().,]/g, '')
      if (title.length > 3 && title.length < 100) {
        return title
      }
    }
  }
  
  return ''
}

function extractDate(text: string): string {
  // Try multiple date formats
  const patterns = [
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /(\d{1,2}-\d{1,2}-\d{4})/,
    /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})/i,
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4})/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const dateStr = match[1]
      try {
        const date = new Date(dateStr)
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0]
        }
      } catch (e) {
        continue
      }
    }
  }
  
  return ''
}

function extractTime(text: string, type: 'start' | 'end'): string {
  const timePatterns = [
    /(\d{1,2}:\d{2}\s*(?:AM|PM))/gi,
    /(\d{1,2}:\d{2})/g,
    /(\d{1,2}\s*(?:AM|PM))/gi
  ]
  
  const times: string[] = []
  
  for (const pattern of timePatterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      let timeStr = match[1].trim()
      
      // Convert to 24-hour format
      if (timeStr.includes('PM') && !timeStr.startsWith('12')) {
        const hour = parseInt(timeStr.split(':')[0]) + 12
        timeStr = timeStr.replace(/\d{1,2}/, hour.toString()).replace(/\s*PM/i, '')
      } else if (timeStr.includes('AM') && timeStr.startsWith('12')) {
        timeStr = timeStr.replace('12', '00').replace(/\s*AM/i, '')
      } else {
        timeStr = timeStr.replace(/\s*[AP]M/i, '')
      }
      
      // Ensure HH:MM format
      if (!timeStr.includes(':')) {
        timeStr += ':00'
      }
      
      // Validate time format
      if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
        const [hours, minutes] = timeStr.split(':').map(Number)
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
          times.push(formattedTime)
        }
      }
    }
  }
  
  // Remove duplicates and sort
  const uniqueTimes = [...new Set(times)].sort()
  
  if (type === 'start') {
    return uniqueTimes[0] || ''
  } else {
    return uniqueTimes[1] || uniqueTimes[0] || ''
  }
}

function extractLocation(text: string): string {
  const patterns = [
    /(?:location|venue|address|at):\s*([^\n\r]+)/i,
    /(?:held at|taking place at|located at)\s*([^\n\r]+)/i,
    /(\d+[^\n\r]*(?:street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd)[^\n\r]*)/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const location = match[1].trim().replace(/[^\w\s\-&().,#]/g, '')
      if (location.length > 3 && location.length < 200) {
        return location
      }
    }
  }
  
  return ''
}

function extractDescription(text: string): string {
  const patterns = [
    /(?:description|details|about):\s*([^\n\r]+)/i,
    /(?:agenda|summary):\s*([^\n\r]+)/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const description = match[1].trim()
      if (description.length > 10 && description.length < 500) {
        return description
      }
    }
  }
  
  // If no specific description found, use first few sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20)
  if (sentences.length > 0) {
    return sentences[0].trim().substring(0, 200)
  }
  
  return ''
} 