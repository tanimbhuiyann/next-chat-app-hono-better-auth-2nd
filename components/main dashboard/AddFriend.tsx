import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { hc } from "hono/client"
import { AppType } from "@/hono"

const client = hc<AppType>("http://localhost:3000/")

export default function AddFriend({ userEmail }: { userEmail: string }) {
  const [addNewFriend, setNewFriend] = useState("")

  const sendNewFriendRequest = async () => {
    if (!addNewFriend.trim()) return

    try {
      await client.api["friend-request"].send.$post({
        json: {
          senderEmail: userEmail,
          receiverEmail: addNewFriend,
        },
      })

      setNewFriend("")
      console.log("Request sent")
    } catch (error) {
      console.error("Error sending friend request", error)
    }
  }

  return (
    <div className="flex-1 p-6 bg-background">
      <h2 className="text-2xl font-bold mb-4 text-foreground">Add Friend</h2>
      <div className="max-w-md">
        <Input 
          type="email"
          placeholder="Enter friend's email"
          value={addNewFriend}
          onChange={(e) => setNewFriend(e.target.value)}
          className="mb-4"
        />
        <Button 
          onClick={sendNewFriendRequest}
          disabled={!addNewFriend.trim()}
        >
          Send Friend Request
        </Button>
      </div>
    </div>
  )
}