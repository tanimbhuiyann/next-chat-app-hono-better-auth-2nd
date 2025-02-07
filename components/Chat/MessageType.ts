export type Message = {
    id?: string
    senderId: string
    receiverId: string
    content: string
    createdAt: Date
    role?: "user" | "assistant"
    imageUrl?: string
  }