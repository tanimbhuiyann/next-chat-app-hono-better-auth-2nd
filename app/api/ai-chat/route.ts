import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    
    const response = await fetch('https://api.groq.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant. Provide clear and concise responses."
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 700,
      }),
    })

    const data = await response.json()
    
    return NextResponse.json({
      response: data.choices[0].message.content
    })
  } catch (error) {
    console.error(' error:', error);
    return NextResponse.json(
      { error: 'AI response failed' },
      { status: 500 }
    )
  }
}