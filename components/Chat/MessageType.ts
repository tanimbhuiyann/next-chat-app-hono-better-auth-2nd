export interface Message {
  id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  imageUrl?: string;
  encryptedAESKey?: string; // Add this field
  senderEncryptedAESKey?: string; // For sender - ADD THIS
  role?: "user" | "assistant";
  createdAt: Date;
  readAt?: Date;
}