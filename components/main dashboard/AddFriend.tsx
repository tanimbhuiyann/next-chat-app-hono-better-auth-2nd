import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { hc } from "hono/client";
import { AppType } from "@/hono";
import { toast } from "sonner";
import { config } from "@/lib/config";

/* const client = hc<AppType>("http://localhost:3000/"); */
const client = hc<AppType>(config.backendUrl);
export default function AddFriend({ userEmail }: { userEmail: string }) {
  const [addNewFriend, setNewFriend] = useState("");

  const sendNewFriendRequest = async () => {
    if (!addNewFriend.trim()) return;

    try {
      const response = await client.api["friend-request"].send.$post({
        json: {
          senderEmail: userEmail,
          receiverEmail: addNewFriend,
        },
      });


      switch (response.status) {
        case 401:
          toast.warning("You cannot send a friend request to yourself")
          break
        case 400:
          toast.info("Friend request already exists")
          break
        case 201:
          toast.success("Friend request sent successfully")
          setNewFriend("")
          break
        case 404:
          toast.error("User not found")
          break
        case 500:
          toast.error("Failed to send friend request")
          break
      }

      setNewFriend("");
      //console.log("Request sent")
    } catch (error) {
      console.error("Error sending friend request", error);
    }
  };

  return (
    <div className="flex-1 p-6 bg-background">
    <div className="mb-6 ">
    <h2 className="text-2xl font-bold mb-4 text-foreground">Add Friend</h2>
    <p className="text-muted-foreground mb-4">
      Add a friend by entering their email address. They will receive a friend request notification.
    </p>
    </div>
     
      
      <div className="max-w-md">
        <Input
          type="email"
          placeholder="Enter friend's @email"
          value={addNewFriend}
          onChange={(e) => setNewFriend(e.target.value)}
          className="mb-4"
        />
        <Button onClick={sendNewFriendRequest} disabled={!addNewFriend.trim()}>
          Send Friend Request
        </Button>
      </div>
    </div>
  );
}
