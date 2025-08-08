"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import io from "socket.io-client";
import { authClient } from "@/lib/auth-client";
import ai_image from "../../public/ai_image.png";
import { ChatHeader } from "../Chat/ChatHeader";
import { MessageBubble } from "../Chat/MessageBubble";
import { ChatInput } from "../Chat/ChatInput";
import { Message } from "../Chat/MessageType";
import { TypingIndicator } from "../Chat/TypingIndicator";
import { config } from "@/lib/config";
import { EncryptionService } from '@/lib/encryption';



export default function ChatArea({
  selectedFriend,
}: {
  selectedFriend: { name: string; id: string; image?: string } | null;
}) {
  const [socket, setSocket] = useState<SocketIOClient.Socket | null>(null);
  const [friendMessages, setFriendMessages] = useState<Message[]>([]);
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { data: session } = authClient.useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstAiMessage = useRef(true);
  const [isEncryptionReady, setIsEncryptionReady] = useState(false);
  
const encryptionService = EncryptionService.getInstance();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(
    null as unknown as HTMLInputElement
  );

  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [friendMessages, aiMessages, scrollToBottom, isTyping]);


useEffect(() => {
  const initializeEncryption = async () => {
    if (session?.user?.id) {
      try {
        console.log('Initializing encryption for user:', session.user.id);
        await encryptionService.initializeUserKeys(session.user.id);
        setIsEncryptionReady(true);
        console.log('Encryption initialized successfully');
      } catch (error) {
        console.error('Failed to initialize encryption:', error);
        // Set ready to false but still allow non-encrypted messaging
        setIsEncryptionReady(false);
      }
    }
  };

  initializeEncryption();
}, [session?.user?.id]);



  const handleAiChat = async (userMessage: string) => {
    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
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
        }
      );

      if (!response.ok) {
        throw new Error("AI response failed");
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      setAiMessages((prev) => [
        ...prev,
        {
          senderId: "ai-assistant",
          receiverId: session?.user.id || "",
          content: aiResponse,
          role: "assistant",
          createdAt: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error in AI chat:", error);
      setAiMessages((prev) => [
        ...prev,
        {
          senderId: "ai-assistant",
          receiverId: session?.user.id || "",
          content: "Sorry, I encountered an error processing your request.",
          role: "assistant",
          createdAt: new Date(),
        },
      ]);
    }
  };

  useEffect(() => {
    setNewMessage("");
    setIsTyping(false);

    if (!session?.user || !selectedFriend) return;

    if (selectedFriend.id === "ai-assistant") {
      if (isFirstAiMessage.current || aiMessages.length === 0) {
        setAiMessages((prev) => {
          const hasWelcomeMessage = prev.some(
            (msg) =>
              msg.content === "Assalamualikum, how can I assist you today?"
          );

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
            ];
          }
          return prev;
        });
        isFirstAiMessage.current = false;
      }
      return;
    }

    const newSocket = io(config.socketUrl, {
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

// Updated decryption logic in ChatArea.tsx useEffect

// Replace the "receive_message" socket handler with this:
newSocket.on("receive_message", async (message: Message) => {
  try {
    // Decrypt message if it's encrypted and not from AI
    if (message.encryptedAESKey && message.senderId !== "ai-assistant") {
      let aesKey: string;
      
      // Check if this is our own message (we are the sender)
      if (message.senderId === session?.user?.id && message.senderEncryptedAESKey) {
        // Use our own encrypted AES key
        aesKey = encryptionService.decryptAESKey(message.senderEncryptedAESKey);
      } else {
        // Use the receiver's encrypted AES key
        aesKey = encryptionService.decryptAESKey(message.encryptedAESKey);
      }
      
      const decryptedContent = encryptionService.decryptMessage(message.content, aesKey);
      setFriendMessages((prev) => [...prev, {
        ...message,
        content: decryptedContent // Display decrypted content
      }]);
    } else {
      setFriendMessages((prev) => [...prev, message]);
    }
  } catch (error) {
    console.error('Failed to decrypt message:', error);
    // Show encrypted message or error indicator
    setFriendMessages((prev) => [...prev, {
      ...message,
      content: "[Encrypted message - failed to decrypt]"
    }]);
  }
});

// Replace the "message_history" socket handler with this:
newSocket.on("message_history", async (history: Message[]) => {
  try {
    // Decrypt message history
    const decryptedHistory = await Promise.all(
      history.map(async (message) => {
        if (message.encryptedAESKey && message.senderId !== "ai-assistant") {
          try {
            let aesKey: string;
            
            // Check if this is our own message (we are the sender)
            if (message.senderId === session?.user?.id && message.senderEncryptedAESKey) {
              // Use our own encrypted AES key
              aesKey = encryptionService.decryptAESKey(message.senderEncryptedAESKey);
            } else {
              // Use the receiver's encrypted AES key
              aesKey = encryptionService.decryptAESKey(message.encryptedAESKey);
            }
            
            const decryptedContent = encryptionService.decryptMessage(message.content, aesKey);
            return { ...message, content: decryptedContent };
          } catch (error) {
            console.error('Failed to decrypt historical message:', error);
            return { ...message, content: "[Encrypted message - failed to decrypt]" };
          }
        }
        return message;
      })
    );
    setFriendMessages(decryptedHistory);
  } catch (error) {
    console.error('Failed to decrypt message history:', error);
    setFriendMessages(history);
  }
});

    newSocket.on("typing_On", ({ userId }: { userId: string }) => {
      console.log("typing_On", userId);
      if (userId === selectedFriend.id) {
        setIsTyping(true);
      }
    });

    newSocket.on("typing_Off", ({ userId }: { userId: string }) => {
      console.log("typing_Off", userId);
      if (userId === selectedFriend.id) {
        setIsTyping(false);
      }
    });

    setSocket(newSocket);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      newSocket.disconnect();
    };
  },  [session?.user, selectedFriend, isEncryptionReady]);

  const emitTyping = useCallback(() => {
    if (
      !socket ||
      !session?.user ||
      !selectedFriend ||
      selectedFriend.id === "ai-assistant"
    )
      return;
    socket.emit("typing_On", {
      senderId: session.user.id,
      receiverId: selectedFriend.id,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_Off", {
        senderId: session.user.id,
        receiverId: selectedFriend.id,
      });
    }, 1000) as NodeJS.Timeout;
  }, [socket, session?.user, selectedFriend]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    emitTyping();
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);

      const response = await fetch("http://localhost:3000/api/uploadImage", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
        });
        throw new Error(`Upload failed: ${errorText}`);
      }

      const data = await response.json();
      console.log("Upload successful:", data);
      setIsUploading(false);
      return data.url;
    } catch (error) {
      console.error("Comprehensive upload error:", error);
      return null;
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setImageFile(null);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile || !session?.user || !selectedFriend) return;

    try {
      const imageUrl = await uploadImage(imageFile);

      if (!imageUrl) {
        console.error("Failed to upload image");
        return;
      }

      const imageMessage: Message = {
        senderId: session.user.id,
        receiverId: selectedFriend.id,
        content: "Sent an image",
        role: "user",
        createdAt: new Date(),
        imageUrl,
      };

      if (selectedFriend.id === "ai-assistant") {
        setAiMessages((prev) => [...prev, imageMessage]);
      } else {
        socket?.emit("send_message", imageMessage);
      }
    } catch (error) {
      console.error("Error in image upload process", error);
    } finally {
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };











// Updated handleSendMessage function in ChatArea.tsx
const handleSendMessage = useCallback(async () => {
  if (imageFile) {
    await handleImageUpload();
    return;
  }
  if (!newMessage.trim() || !session?.user || !selectedFriend || !isEncryptionReady) return;

  // Skip encryption for AI assistant
  if (selectedFriend.id === "ai-assistant") {
    const messageData: Message = {
      senderId: session.user.id,
      receiverId: selectedFriend.id,
      content: newMessage,
      role: "user",
      createdAt: new Date(),
    };
    setAiMessages((prev) => [...prev, messageData]);
    handleAiChat(newMessage);
    setNewMessage("");
    return;
  }

  try {
    // Generate AES key for this message
    const aesKey = encryptionService.generateAESKey();
    
    // Encrypt the message with AES
    const encryptedContent = encryptionService.encryptMessage(newMessage, aesKey);
    
    // Get recipient's public key
    const recipientPublicKey = await encryptionService.getRecipientPublicKey(selectedFriend.id);
    
    // Get sender's (own) public key
    const senderPublicKey = encryptionService.getPublicKey();
    
    if (!senderPublicKey) {
      throw new Error('Sender public key not available');
    }
    
    // Encrypt AES key with recipient's public key
    const encryptedAESKey = encryptionService.encryptAESKey(aesKey, recipientPublicKey);
    
    // Encrypt AES key with sender's public key (for your own decryption)
    const senderEncryptedAESKey = encryptionService.encryptAESKey(aesKey, senderPublicKey);

    const messageData: Message = {
      senderId: session.user.id,
      receiverId: selectedFriend.id,
      content: encryptedContent, // Encrypted content
      encryptedAESKey, // Encrypted AES key for receiver
      senderEncryptedAESKey, // Encrypted AES key for sender
      role: "user",
      createdAt: new Date(),
    };

    socket?.emit("send_message", messageData);
    setNewMessage("");
  } catch (error) {
    console.error('Failed to encrypt message:', error);
    // Fallback to unencrypted message or show error
  }
}, [newMessage, socket, session?.user, selectedFriend, imageFile, isEncryptionReady]);

  if (!selectedFriend) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center">
        <p className="text-xl text-muted-foreground">
          Select a friend to start chatting
        </p>
      </div>
    );
  }

  const messages =
    selectedFriend.id === "ai-assistant" ? aiMessages : friendMessages;

  return (
    <div className="flex-1 flex flex-col bg-background">
      <ChatHeader selectedFriend={selectedFriend} aiImage={ai_image} />
      <ScrollArea className="flex-1 p-4">
        {messages.map((msg, index) => (
          <MessageBubble
            key={msg.id || index}
            message={msg}
            isCurrentUser={msg.senderId === session?.user?.id}
            userImage={session?.user?.image ?? undefined}
            friendImage={selectedFriend.image}
            friendName={selectedFriend.name}
            aiImage={ai_image.src}
          />
        ))}
        {isTyping && (
          <div className="flex items-center my-2">
            <TypingIndicator userImage={selectedFriend.image} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </ScrollArea>

      <ChatInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        imageFile={imageFile}
        setImageFile={setImageFile}
        isUploading={isUploading}
        selectedFriend={selectedFriend}
        fileInputRef={fileInputRef}
        handleTyping={handleTyping}
      />
    </div>
  );
}
