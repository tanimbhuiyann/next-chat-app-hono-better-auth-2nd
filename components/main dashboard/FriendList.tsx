import { useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { hc } from "hono/client"
import type { AppType } from "@/hono"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import ai_image from "../../public/ai_image.png"
import { config } from "@/lib/config";

/* const client = hc<AppType>("http://localhost:3000/") */
const client = hc<AppType>(config.backendUrl)
type Friend = {
  id: string
  name: string
  image: string
  status: string
}

export default function FriendList({
  onSelectFriend,
  userEmail,
}: {
  onSelectFriend: (friend: { name: string; id: string; image: string }) => void
  userEmail: string
}) {
  const [friendList, setFriendList] = useState<Friend[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchFriendList = async () => {
      if (!userEmail) return

      try {
        const response = await client.api["friend-request"].friends[":email"].$get({
          param: { email: userEmail },
        })

        if (response.ok) {
          const data = await response.json()
          const friends = Array.isArray(data) ? data : data.friends || []
          setFriendList(friends)
        }
      } catch (error) {
        console.error("Error fetching friend list", error)
        setFriendList([])
      }
    }

    fetchFriendList()
  }, [userEmail])

  const filteredFriends = friendList.filter((friend) => friend.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="w-96 bg-background border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Friends ({friendList.length})</h2>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div
          className="flex items-center p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors duration-200"
          onClick={() =>
            onSelectFriend({
              name: "MY AI",
              id: "ai-assistant",
              image: "/images/ai-assistant.png",
            })
          }
        >
          <div className="w-12 h-12 relative mr-3">
            <Image
              src={ai_image || "/placeholder.svg"}
              alt="ai_image"
              layout="fill"
              className="rounded-full object-cover"
            />
          </div>
          <h3 className="font-semibold text-foreground">MY AI</h3>
        </div>
        <ul>
          {filteredFriends.map((friend) => (
            <li
              key={friend.id}
              className="flex items-center p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors duration-200"
              onClick={() => onSelectFriend({ name: friend.name, id: friend.id, image: friend.image })}
            >
              <div className="w-12 h-12 relative mr-3">
                <Image
                  src={friend.image || "/default-profile.png"}
                  alt={friend.name}
                  layout="fill"
                  className="rounded-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{friend.name}</h3>
               {/*  <p className="text-sm text-muted-foreground">{friend.status}</p> */}
              </div>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}

