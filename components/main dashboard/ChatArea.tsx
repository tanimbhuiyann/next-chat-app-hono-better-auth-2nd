"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import io from "socket.io-client";
import { authClient } from "@/lib/auth-client";

type Message = {
  id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt?: Date;
  role?: "user" | "assistant";
};

export default function ChatArea({
  selectedFriend,
}: {
  selectedFriend: { name: string; id: string } | null;
}) {
  const [socket, setSocket] = useState<any | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { data: session } = authClient.useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

const handleAiChat = async (userMessage: string) => {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`
      },
      body: JSON.stringify({
        messages: [
          // Include last few messages for context, limit to prevent token overflow
          ...messages.slice(-5).filter(m => m.role !== undefined).map(m => ({
            role: m.role,
            content: m.content
          })),
          { role: 'user', content: userMessage }
        ],
        model: 'llama-3.3-70b-versatile'
      })
    });

    if (!response.ok) {
      throw new Error('AI response failed');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    setMessages(prev => [
      ...prev, 
      { 
        senderId: 'ai-assistant', 
        receiverId: session?.user.id || '', 
        content: aiResponse,
        role: 'assistant'
      }
    ]);
  } catch (error) {
    console.error('Error in AI chat:', error);
    setMessages(prev => [
      ...prev, 
      { 
        senderId: 'ai-assistant', 
        receiverId: session?.user.id || '', 
        content: 'Sorry, I encountered an error processing your request.',
        role: 'assistant'
      }
    ]);
  }
};
  useEffect(() => {
  
    setMessages([]);
    setNewMessage("");

    if (!session?.user || !selectedFriend) return;

    if (selectedFriend.id == "ai-assistant") {
      setMessages([
        {
          id: "ai-assistant",
          senderId: "ai-assistant",
          receiverId: session.user.id,
          content: "Assalamualikum, how can I assist you today?",
          role: "assistant",
        },
      ]);
      return;
    }

    const newSocket = io("http://localhost:3002", {
      transports: ["websocket"],
      query: { userId: session.user.id },
    });

    newSocket.on("connect", () => {
      newSocket.emit("join_chat", {
        senderId: session.user.id,
        receiverId: selectedFriend.id,
      });

      newSocket.emit("get_message_history", {
        senderId: session.user.id,
        receiverId: selectedFriend.id,
      });
    });

    newSocket.on("receive_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on("message_history", (history: Message[]) => {
      setMessages(history);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [session?.user, selectedFriend]);

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !socket || !session?.user || !selectedFriend)
      return;

    const messageData: Message = {
      senderId: session.user.id,
      receiverId: selectedFriend.id,
      content: newMessage,
      role: "user",
    };

    if (selectedFriend.id === "ai-assistant") {
      setMessages((prev) => [...prev, messageData]);
      handleAiChat(newMessage);
    } else {
      socket.emit("send_message", messageData);
    }

    setNewMessage("");
  }, [newMessage, socket, session?.user, selectedFriend]);

  if (!selectedFriend) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center">
        <p className="text-xl text-muted-foreground">
          Select a friend to start chatting
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="bg-background p-4 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">
          {selectedFriend.name}
        </h2>
      </div>
      <ScrollArea className="flex-1 p-4">
        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`mb-4 ${
              msg.senderId === session?.user?.id ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl break-words rounded-lg px-4 py-2 ${
                msg.senderId === session?.user?.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-4 border-t border-border flex gap-2"
      >
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
  );
}
