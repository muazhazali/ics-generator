import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // This endpoint will be called from the client-side to get the user's timezone
    // The actual timezone detection happens on the client side using Intl.DateTimeFormat
    return NextResponse.json({ 
      message: 'Timezone detection should be done client-side using Intl.DateTimeFormat().resolvedOptions().timeZone' 
    })
  } catch (error) {
    console.error('Error in timezone detection endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to process timezone detection' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { timezone } = await request.json()
    
    if (!timezone) {
      return NextResponse.json(
        { error: 'Timezone is required' },
        { status: 400 }
      )
    }

    // Validate that the timezone is a valid IANA timezone
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone })
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid timezone format' },
        { status: 400 }
      )
    }

    // Return the validated timezone
    return NextResponse.json({ timezone })
  } catch (error) {
    console.error('Error validating timezone:', error)
    return NextResponse.json(
      { error: 'Failed to validate timezone' },
      { status: 500 }
    )
  }
} 