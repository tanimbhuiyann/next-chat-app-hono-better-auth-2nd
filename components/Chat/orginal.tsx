"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Send, ImagePlus, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import io from "socket.io-client"
import { authClient } from "@/lib/auth-client"
import Image from "next/image"
import { format } from "date-fns"
import ai_image from "../../public/ai_image.png"



type Message = {
  id?: string
  senderId: string
  receiverId: string
  content: string
  createdAt: Date
  role?: "user" | "assistant"
  imageUrl?: string
}

export default function OrginalChatArea({
  selectedFriend,
}: {
  selectedFriend: { name: string; id: string; image?: string } | null
}) {
  const [socket, setSocket] = useState<SocketIOClient.Socket | null>(null)
  const [friendMessages, setFriendMessages] = useState<Message[]>([])
  const [aiMessages, setAiMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const { data: session } = authClient.useSession()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isFirstAiMessage = useRef(true)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [friendMessages, aiMessages, scrollToBottom]) // Added scrollToBottom to dependencies

  const handleAiChat = async (userMessage: string) => {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            ...aiMessages
              .slice(-5)
              .filter((m) => m.role !== undefined)
              .map((m) => ({
                role: m.role,
                content: m.content,
              })),
            { role: "user", content: userMessage },
          ],
          model: "llama-3.3-70b-versatile",
        }),
      })

      if (!response.ok) {
        throw new Error("AI response failed")
      }

      const data = await response.json()
      const aiResponse = data.choices[0].message.content

      setAiMessages((prev) => [
        ...prev,
        {
          senderId: "ai-assistant",
          receiverId: session?.user.id || "",
          content: aiResponse,
          role: "assistant",
          createdAt: new Date(),
        },
      ])
    } catch (error) {
      console.error("Error in AI chat:", error)
      setAiMessages((prev) => [
        ...prev,
        {
          senderId: "ai-assistant",
          receiverId: session?.user.id || "",
          content: "Sorry, I encountered an error processing your request.",
          role: "assistant",
          createdAt: new Date(),
        },
      ])
    }
  }

  useEffect(() => {
    setNewMessage("")

    if (!session?.user || !selectedFriend) return

    if (selectedFriend.id === "ai-assistant") {
      if (isFirstAiMessage.current || aiMessages.length === 0) {
        setAiMessages((prev) => {
          const hasWelcomeMessage = prev.some((msg) => msg.content === "Assalamualikum, how can I assist you today?")

          if (!hasWelcomeMessage) {
            return [
              {
                id: "ai-assistant",
                senderId: "ai-assistant",
                receiverId: session.user.id,
                content: "Assalamualikum, how can I assist you today?",
                role: "assistant",
                createdAt: new Date(),
              },
              ...prev,
            ]
          }
          return prev
        })
        isFirstAiMessage.current = false
      }
      return
    }

    const newSocket = io("http://localhost:3002", {
      transports: ["websocket"],
      query: { userId: session.user.id },
    })

    newSocket.on("connect", () => {
      newSocket.emit("join_chat", {
        senderId: session.user.id,
        receiverId: selectedFriend.id,
      })

      newSocket.emit("get_message_history", {
        senderId: session.user.id,
        receiverId: selectedFriend.id,
      })
    })

    newSocket.on("receive_message", (message: Message) => {
      setFriendMessages((prev) => [...prev, message])
    })

    newSocket.on("message_history", (history: Message[]) => {
      setFriendMessages(history)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [session?.user, selectedFriend])

  //____________________________________________________________________________________________________________________________

  const uploadImage = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    try {
      setIsUploading(true)

      const response = await fetch("http://localhost:3000/api/uploadImage", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Upload failed:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
        })
        throw new Error(`Upload failed: ${errorText}`)
      }

      const data = await response.json()
      console.log("Upload successful:", data)
      setIsUploading(false)
      return data.url
    } catch (error) {
      console.error("Comprehensive upload error:", error)
      return null
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setImageFile(null)
    }
  }

  const handleImageUpload = async () => {
    if (!imageFile || !session?.user || !selectedFriend) return

    try {
      const imageUrl = await uploadImage(imageFile)

      if (!imageUrl) {
        console.error("Failed to upload image")
        return
      }

      const imageMessage: Message = {
        senderId: session.user.id,
        receiverId: selectedFriend.id,
        content: "Sent an image",
        role: "user",
        createdAt: new Date(),
        imageUrl,
      }

      if (selectedFriend.id === "ai-assistant") {
        setAiMessages((prev) => [...prev, imageMessage])
      } else {
        socket?.emit("send_message", imageMessage)
      }
    } catch (error) {
      console.error("Error in image upload process", error)
    } finally {
      setImageFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleSendMessage = useCallback(async () => {
    if (imageFile) {
      await handleImageUpload()
      return
    }

    if (!newMessage.trim() || !session?.user || !selectedFriend) return

    const messageData: Message = {
      senderId: session.user.id,
      receiverId: selectedFriend.id,
      content: newMessage,
      role: "user",
      createdAt: new Date(),
    }

    if (selectedFriend.id === "ai-assistant") {
      setAiMessages((prev) => [...prev, messageData])
      handleAiChat(newMessage)
    } else {
      socket?.emit("send_message", messageData)
    }

    setNewMessage("")
  }, [newMessage, socket, session?.user, selectedFriend, imageFile])

  if (!selectedFriend) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Select a friend to start chatting</p>
      </div>
    )
  }

  const messages = selectedFriend.id === "ai-assistant" ? aiMessages : friendMessages

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="bg-background p-4 border-b border-border flex items-center">
        <div className="w-10 h-10 relative mr-3">
          <Image
            src={selectedFriend.id === "ai-assistant" ? ai_image : selectedFriend.image || "/default-profile.png"}
            alt={selectedFriend.name}
            layout="fill"
            className="rounded-full object-cover"
          />
        </div>
        <h2 className="text-xl font-semibold text-foreground">{selectedFriend.name}</h2>
      </div>
      <ScrollArea className="flex-1 p-4">
        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`mb-4 flex ${msg.senderId === session?.user?.id ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex ${msg.senderId === session?.user?.id ? "flex-row-reverse" : "flex-row"} group`}>
              <div className="w-8 h-8 relative mx-2">
                <Image
                  src={
                    msg.senderId === session?.user?.id
                      ? session.user?.image || "/default-profile.png"
                      : selectedFriend.id === "ai-assistant"
                        ? ai_image
                        : selectedFriend.image || "/default-profile.png"
                  }
                  alt={msg.senderId === session?.user?.id ? "You" : selectedFriend.name}
                  layout="fill"
                  className="rounded-full object-cover"
                />
              </div>
              <div>
                <div
                  className={`max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl break-words rounded-lg   ${
                    msg.senderId === session?.user?.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >{msg.imageUrl ? (
                  <div className="space-y-2 w-[250px] ">
                    <Image
                      src={msg.imageUrl || "/placeholder.svg"}
                      alt="Sent Image"
                      layout="responsive"
                      width={500}
                      height={500}
                      className="rounded-lg w-full h-auto"
                    />
                   {/*  <p className="text-xs text-muted-foreground break-all">Image URL: {msg.imageUrl}</p> */}
                  </div>
                ) : (
                  <p className=" px-4 py-2">{msg.content}</p>
                )}
                </div>
                <p
                  className={`text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                    msg.senderId === session?.user?.id ? "text-right" : "text-left"
                  }`}
                >
                  {format(new Date(msg.createdAt), "HH:mm")}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSendMessage()
        }}
        className="p-4 border-t border-border flex gap-2"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
          className="hidden"
          id="file-input"
          disabled={isUploading}
        />
        <label
          htmlFor="file-input"
          className={`cursor-pointer p-2 rounded-lg ${isUploading ? "bg-muted cursor-not-allowed" : "hover:bg-accent"}`}
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
        </label>
        {imageFile && (
          <div className="flex items-center gap-2 bg-accent p-2 rounded-lg">
            <span className="text-sm truncate max-w-[100px]">{imageFile.name}</span>
            <button
              type="button"
              onClick={() => {
                setImageFile(null)
                if (fileInputRef.current) fileInputRef.current.value = ""
              }}
              className="text-red-500 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`Message ${selectedFriend.name}...`}
          className="flex-1"
        />
        <Button type="submit">
          <Send size={20} />
        </Button>
      </form>
    </div>
  )
}