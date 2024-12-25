import { useEffect, useState } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { hc } from "hono/client"
import { AppType } from "@/hono"
import Image from "next/image"

const client = hc<AppType>("http://localhost:3000/")

type FriendRequest = {
  friendRequest: {
    id: string
    senderEmail: string
    status: string
  }
  sender: {
    name: string
    image: string | null
  }
}

export default function FriendRequests({ userEmail }: { userEmail: string }) {
  const [requests, setRequests] = useState<FriendRequest[]>([])

  const fetchRequests = async () => {
    if (!userEmail) return

    try {
      const response = await client.api["friend-request"].incoming[":email"].$get({
        param: { email: userEmail },
      })

      if (response.ok) {
        const data = await response.json()
        const requestsArray = Array.isArray(data) ? data : data.incomingRequest || []
        setRequests(requestsArray.filter(req => req.friendRequest.status === 'PENDING'))
      }
    } catch (error) {
      console.error("Error fetching friend requests", error)
      setRequests([])
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [userEmail])

  const handleAction = async (id: string, action: 'accept' | 'decline') => {
    try {
      if (action === 'accept') {
        await client.api["friend-request"].update[":id"].$put({
          param: { id },
          json: { status: 'PENDING' }
        })
      } else {
        await client.api["friend-request"].delete[":id"].$delete({
          param: { id }
        })
      }
      fetchRequests()
    } catch (error) {
      console.error(`Error ${action}ing request`, error)
    }
  }

  return (
    <div className="flex-1 p-6 bg-background">
      <h2 className="text-2xl font-bold mb-4 text-foreground">
        Friend Requests ({requests.length})
      </h2>
      <ScrollArea className="h-[calc(100vh-200px)]">
        {requests.map((request) => (
          <div
            key={request.friendRequest.id}
            className="flex items-center justify-between p-4 border-b border-border"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 relative mr-3">
                <Image
                  src={request.sender.image || "/default-profile.png"}
                  alt={request.sender.name}
                  layout="fill"
                  className="rounded-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold">{request.sender.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {request.friendRequest.senderEmail}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleAction(request.friendRequest.id, 'accept')}
              >
                Accept
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleAction(request.friendRequest.id, 'decline')}
              >
                Decline
              </Button>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  )
}