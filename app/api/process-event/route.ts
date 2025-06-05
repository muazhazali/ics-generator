import { NextResponse } from 'next/server'

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY
const CEREBRAS_API_URL = 'https://api.cerebras.com/v1/chat/completions'

export async function POST(request: Request) {
  try {
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    if (!CEREBRAS_API_KEY) {
      console.error('Cerebras API key is not configured')
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      )
    }

    console.log('Processing content:', content.substring(0, 100) + '...')

    const response = await fetch(CEREBRAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'cerebras-1.3b',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that extracts event information from text. 
            Extract the following information if available:
            - Event title
            - Date (in YYYY-MM-DD format)
            - Start time (in HH:MM format)
            - End time (in HH:MM format)
            - Location
            - Description
            
            Return the information in JSON format with these exact keys:
            {
              "title": "string",
              "date": "YYYY-MM-DD",
              "startTime": "HH:MM",
              "endTime": "HH:MM",
              "location": "string",
              "description": "string"
            }`
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Cerebras API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error(`Cerebras API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Cerebras API response:', data)
    
    // Parse the AI response to extract event details
    const aiResponse = data.choices[0].message.content
    let eventData
    
    try {
      eventData = JSON.parse(aiResponse)
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', aiResponse)
      // If the response isn't valid JSON, try to extract information using regex
      eventData = {
        title: extractTitle(aiResponse),
        date: extractDate(aiResponse),
        startTime: extractTime(aiResponse, 'start'),
        endTime: extractTime(aiResponse, 'end'),
        location: extractLocation(aiResponse),
        description: extractDescription(aiResponse)
      }
    }

    // Validate the extracted data
    if (!eventData.title || !eventData.date) {
      console.error('Missing required fields in extracted data:', eventData)
      return NextResponse.json(
        { error: 'Failed to extract required event information' },
        { status: 400 }
      )
    }

    return NextResponse.json(eventData)
  } catch (error) {
    console.error('Error processing event:', error)
    return NextResponse.json(
      { error: 'Failed to process event information' },
      { status: 500 }
    )
  }
}

// Helper functions to extract information from text
function extractTitle(text: string): string {
  const titleMatch = text.match(/title:?\s*([^\n]+)/i)
  return titleMatch ? titleMatch[1].trim() : ''
}

function extractDate(text: string): string {
  const dateMatch = text.match(/date:?\s*(\d{4}-\d{2}-\d{2})/i)
  return dateMatch ? dateMatch[1] : ''
}

function extractTime(text: string, type: 'start' | 'end'): string {
  const timeMatch = text.match(new RegExp(`${type}\\s*time:?\\s*(\\d{2}:\\d{2})`, 'i'))
  return timeMatch ? timeMatch[1] : ''
}

function extractLocation(text: string): string {
  const locationMatch = text.match(/location:?\s*([^\n]+)/i)
  return locationMatch ? locationMatch[1].trim() : ''
}

function extractDescription(text: string): string {
  const descMatch = text.match(/description:?\s*([^\n]+)/i)
  return descMatch ? descMatch[1].trim() : ''
} 