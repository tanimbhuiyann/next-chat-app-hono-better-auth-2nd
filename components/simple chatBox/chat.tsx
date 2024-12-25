"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import io from 'socket.io-client';
import { authClient } from "@/lib/auth-client";

type Message = {
  id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt?: Date;
};

type ChatProps = {
  friendName: string;
  friendId: string;
  onClose: () => void;
};

export function Chat({ friendName, friendId, onClose }: ChatProps) {
  const [socket, setSocket] = useState<any | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { data: session } = authClient.useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto scroll when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Establish socket connection
  useEffect(() => {
    if (!session?.user) return;

    const newSocket = io('http://localhost:3002', {
      transports: ['websocket'],
      query: { userId: session.user.id }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      // Join room for message exchange
      newSocket.emit('join_chat', {
        senderId: session.user.id,
        receiverId: friendId
      });

      // Fetch message history
      newSocket.emit('get_message_history', {
        senderId: session.user.id,
        receiverId: friendId
      });
    });

    // Listen for incoming messages
    newSocket.on('receive_message', (message: Message) => {
      console.log('Message received:', message);
      setMessages(prevMessages => [...prevMessages, message]);
    });

    // Listen for message history
    newSocket.on('message_history', (history: Message[]) => {
      setMessages(history);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [session?.user, friendId]);

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !socket || !session?.user) return;

    const messageData: Message = {
      senderId: session.user.id,
      receiverId: friendId,
      content: newMessage
    };
      
    console.log('Message to send:', messageData);
    socket.emit('send_message', messageData);

    // Clear input
    setNewMessage('');
  }, [newMessage, socket, session?.user, friendId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Function to render message with correct sender name
  const renderMessage = (message: Message) => {
    const isCurrentUser = message.senderId === session?.user?.id;
    const senderName = isCurrentUser ? 'You' : friendName;
    
    return (
      <div 
        key={message.id} 
        className={`mb-4 ${isCurrentUser ? 'text-right' : 'text-left'}`}
      >
        <div 
          className={`inline-block max-w-[80%] rounded-lg px-4 py-2 ${
            isCurrentUser 
              ? 'bg-rose-500 text-white' 
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <div className="text-sm font-semibold mb-1">
            {senderName}
          </div>
          <div className="break-words">
            {message.content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-80 h-96 flex flex-col">
      <CardHeader className="flex justify-between items-center p-4 border-b">
        <h3 className="font-bold text-lg">{friendName}</h3>
        <Button 
          variant="ghost" 
          onClick={onClose}
          className="h-8 px-2"
        >
          Close
        </Button>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map(message => renderMessage(message))}
        <div ref={messagesEndRef} /> {/* Scroll anchor */}
      </CardContent>
      
      <CardFooter className="p-4 border-t">
        <div className="flex w-full gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-grow"
          />
          <Button 
            onClick={handleSendMessage}
            className="whitespace-nowrap"
          >
            Send
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}