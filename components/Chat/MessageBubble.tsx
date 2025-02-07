import { format } from "date-fns"
import Image from "next/image"
import { Message } from "./MessageType"

type MessageBubbleProps = {
  message: Message
  isCurrentUser: boolean
  userImage?: string
  friendImage?: string
  friendName: string
  aiImage: string
}

export function MessageBubble({ message, isCurrentUser, userImage, friendImage, friendName, aiImage }: MessageBubbleProps) {
  return (
    <div className={`mb-4 flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex ${isCurrentUser ? "flex-row-reverse" : "flex-row"} group`}>
        <div className="w-8 h-8 relative mx-2">
          <Image
            src={
              isCurrentUser
                ? userImage || "/default-profile.png"
                : message.senderId === "ai-assistant"
                  ? aiImage
                  : friendImage || "/default-profile.png"
            }
            alt={isCurrentUser ? "You" : friendName}
            layout="fill"
            className="rounded-full object-cover"
          />
        </div>
        <div>
          <div
            className={`max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl break-words rounded-lg ${
              isCurrentUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {message.imageUrl ? (
              <div className="space-y-2 w-[250px]">
                <Image
                  src={message.imageUrl}
                  alt="Sent Image"
                  layout="responsive"
                  width={500}
                  height={500}
                  className="rounded-lg w-full h-auto"
                />
              </div>
            ) : (
              <p className="px-4 py-2">{message.content}</p>
            )}
          </div>
          <p
            className={`text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
              isCurrentUser ? "text-right" : "text-left"
            }`}
          >
            {format(new Date(message.createdAt), "HH:mm")}
          </p>
        </div>
      </div>
    </div>
  )
}