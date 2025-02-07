import Image, { StaticImageData } from "next/image"

type ChatHeaderProps = {
  selectedFriend: {
    name: string
    id: string
    image?: string
  }
  aiImage: StaticImageData
}

export function ChatHeader({ selectedFriend, aiImage }: ChatHeaderProps) {
  return (
    <div className="bg-background p-4 border-b border-border flex items-center">
      <div className="w-10 h-10 relative mr-3">
        <Image
          src={selectedFriend.id === "ai-assistant" ? aiImage : selectedFriend.image || "/default-profile.png"}
          alt={selectedFriend.name}
          layout="fill"
          className="rounded-full object-cover"
        />
      </div>
      <h2 className="text-xl font-semibold text-foreground">{selectedFriend.name}</h2>
    </div>
  )
}
