//import { NextResponse } from "next/server";
import 'dotenv/config';
export async function POST(request: Request){
    try{
        const {message} = await request.json()

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions',{
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.AI_API_KEY}`,
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a helpful AI assistant."
                            },
                            {
                                "role": "user",
                                "content": message
                            }
                        ],
                        temperature: 0.7,
        max_tokens: 1000,



        })
    }
}
