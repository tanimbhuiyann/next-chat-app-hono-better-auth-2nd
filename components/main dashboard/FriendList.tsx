"use client"

import { useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { hc } from "hono/client"
import type { AppType } from "@/hono"
import { User, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const client = hc<AppType>("http://localhost:3000/")

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
  onSelectFriend: (friend: { name: string; id: string; image: string}) => void
  userEmail: string
}) {
  const [friendList, setFriendList] = useState<Friend[]>([])
  const [searchTerm, setSearchTerm] = useState("")

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

  const filteredFriends = friendList.filter((friend) => 
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="w-80 bg-background border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Friends ({friendList.length})
        </h2>
        <div className="relative">
          <Search 
            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
            size={18} 
          />
          <Input
            type="text"
            placeholder="Search friends..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div
          className="flex items-center p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors duration-200"
          onClick={() => onSelectFriend({ 
            name: "MY AI", 
            id: "ai-assistant", 
            image: "/ai-assistant.png" 
          })}
        >
          <Avatar className="w-10 h-10 mr-3">
            <AvatarImage src="/ai-assistant.png" alt="AI Assistant" />
            <AvatarFallback>
              <User />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground">MY AI</h3>
            <p className="text-sm text-muted-foreground">Always available</p>
          </div>
        </div>
        <ul>
          {filteredFriends.map((friend) => (
            <li
              key={friend.id}
              className="flex items-center p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors duration-200"
              onClick={() => onSelectFriend({ 
                name: friend.name, 
                id: friend.id, 
                image: friend.image 
              })}
            >
              <Avatar className="w-10 h-10 mr-3">
                <AvatarImage 
                  src={friend.image || "/default-profile.png"} 
                  alt={friend.name} 
                />
                <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-foreground">{friend.name}</h3>
                <p className="text-sm text-muted-foreground">{friend.status}</p>
              </div>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}