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
      timezone: eventData.timezone || 'America/New_York'
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
      model: "llama-3.3-70b",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that extracts event information from text. Make sure to understand the language of the text and extract the information in the same language.
          Extract the following information if available:
          - Event title
          - Date (in YYYY-MM-DD format)
          - Start time (in HH:MM format, 24-hour format)
          - End time (in HH:MM format, 24-hour format)
          - Location
          - Description (any relevant information about the event)
          - Timezone (detect from context, location, or explicit mentions)
          
          For timezone detection, look for:
          - Explicit timezone mentions (EST, PST, GMT+8, UTC, etc.)
          - City/location names that indicate timezone (New York = America/New_York, Singapore = Asia/Singapore, etc.)
          - Time format indicators (9:00 AM EST, 14:00 JST, etc.)
          - Country/region context
          
          Return the timezone in IANA timezone format (e.g., "America/New_York", "Asia/Singapore", "Europe/London").
          If no timezone can be determined, return "America/New_York" as default.
          
          Return ONLY a valid JSON object with these exact keys:
          {
            "title": "string",
            "date": "YYYY-MM-DD",
            "startTime": "HH:MM",
            "endTime": "HH:MM",
            "location": "string",
            "description": "string",
            "timezone": "string"
          }
          
          If you cannot find specific information, use empty strings for missing fields (except timezone which should default to "America/New_York").`,
        },
        {
          role: "user",
          content: content,
        },
      ],
      temperature: 0.1,
      max_completion_tokens: 300,
      response_format: { type: "json_object" },
    });

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
    description: extractDescription(content),
    timezone: extractTimezone(content)
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

function extractTimezone(text: string): string {
  // Timezone mapping for common abbreviations and locations
  const timezoneMap: { [key: string]: string } = {
    // US Timezones
    'EST': 'America/New_York',
    'EDT': 'America/New_York',
    'CST': 'America/Chicago',
    'CDT': 'America/Chicago',
    'MST': 'America/Denver',
    'MDT': 'America/Denver',
    'PST': 'America/Los_Angeles',
    'PDT': 'America/Los_Angeles',
    'AKST': 'America/Anchorage',
    'AKDT': 'America/Anchorage',
    'HST': 'Pacific/Honolulu',
    
    // International
    'UTC': 'UTC',
    'GMT': 'UTC',
    'BST': 'Europe/London',
    'CET': 'Europe/Paris',
    'CEST': 'Europe/Paris',
    'JST': 'Asia/Tokyo',
    'KST': 'Asia/Seoul',
    'CCT': 'Asia/Shanghai', // China Standard Time (using CCT to avoid conflict)
    'SGT': 'Asia/Singapore',
    'HKT': 'Asia/Hong_Kong',
    'IST': 'Asia/Kolkata',
    'AEST': 'Australia/Sydney',
    'AEDT': 'Australia/Sydney',
    
    // Cities and locations
    'new york': 'America/New_York',
    'nyc': 'America/New_York',
    'chicago': 'America/Chicago',
    'denver': 'America/Denver',
    'los angeles': 'America/Los_Angeles',
    'la': 'America/Los_Angeles',
    'san francisco': 'America/Los_Angeles',
    'seattle': 'America/Los_Angeles',
    'london': 'Europe/London',
    'paris': 'Europe/Paris',
    'berlin': 'Europe/Berlin',
    'rome': 'Europe/Rome',
    'tokyo': 'Asia/Tokyo',
    'seoul': 'Asia/Seoul',
    'singapore': 'Asia/Singapore',
    'hong kong': 'Asia/Hong_Kong',
    'shanghai': 'Asia/Shanghai',
    'beijing': 'Asia/Shanghai',
    'mumbai': 'Asia/Kolkata',
    'delhi': 'Asia/Kolkata',
    'sydney': 'Australia/Sydney',
    'melbourne': 'Australia/Melbourne',
    'auckland': 'Pacific/Auckland',
  }
  
  const lowerText = text.toLowerCase()
  
  // Look for explicit timezone mentions
  const timezonePatterns = [
    /\b(EST|EDT|CST|CDT|MST|MDT|PST|PDT|AKST|AKDT|HST|UTC|GMT|BST|CET|CEST|JST|KST|CCT|SGT|HKT|IST|AEST|AEDT)\b/gi,
    /GMT([+-]\d{1,2}):?(\d{2})?/gi,
    /UTC([+-]\d{1,2}):?(\d{2})?/gi,
  ]
  
  for (const pattern of timezonePatterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      const tz = match[1]?.toUpperCase()
      if (tz && timezoneMap[tz]) {
        return timezoneMap[tz]
      }
      
      // Handle GMT/UTC offsets
      if (match[0].includes('GMT') || match[0].includes('UTC')) {
        const offset = match[1]
        if (offset) {
          // Map common GMT offsets to timezones
          const offsetMap: { [key: string]: string } = {
            '+0': 'UTC',
            '+1': 'Europe/Paris',
            '+2': 'Europe/Athens',
            '+3': 'Europe/Moscow',
            '+4': 'Asia/Dubai',
            '+5': 'Asia/Karachi',
            '+5:30': 'Asia/Kolkata',
            '+6': 'Asia/Dhaka',
            '+7': 'Asia/Bangkok',
            '+8': 'Asia/Singapore',
            '+9': 'Asia/Tokyo',
            '+10': 'Australia/Sydney',
            '+12': 'Pacific/Auckland',
            '-5': 'America/New_York',
            '-6': 'America/Chicago',
            '-7': 'America/Denver',
            '-8': 'America/Los_Angeles',
            '-9': 'America/Anchorage',
            '-10': 'Pacific/Honolulu',
          }
          
          const offsetKey = offset + (match[2] ? ':' + match[2] : '')
          if (offsetMap[offsetKey]) {
            return offsetMap[offsetKey]
          }
        }
      }
    }
  }
  
  // Look for city/location mentions
  for (const [location, timezone] of Object.entries(timezoneMap)) {
    if (lowerText.includes(location)) {
      return timezone
    }
  }
  
  // Look for country mentions
  const countryPatterns = [
    { pattern: /\b(usa|united states|america)\b/i, timezone: 'America/New_York' },
    { pattern: /\b(uk|united kingdom|britain)\b/i, timezone: 'Europe/London' },
    { pattern: /\b(japan)\b/i, timezone: 'Asia/Tokyo' },
    { pattern: /\b(china)\b/i, timezone: 'Asia/Shanghai' },
    { pattern: /\b(singapore)\b/i, timezone: 'Asia/Singapore' },
    { pattern: /\b(australia)\b/i, timezone: 'Australia/Sydney' },
    { pattern: /\b(india)\b/i, timezone: 'Asia/Kolkata' },
    { pattern: /\b(germany)\b/i, timezone: 'Europe/Berlin' },
    { pattern: /\b(france)\b/i, timezone: 'Europe/Paris' },
  ]
  
  for (const { pattern, timezone } of countryPatterns) {
    if (pattern.test(text)) {
      return timezone
    }
  }
  
  // Default fallback
  return 'America/New_York'
} 