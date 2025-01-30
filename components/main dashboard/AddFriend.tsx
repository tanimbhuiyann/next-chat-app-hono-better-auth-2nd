import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { hc } from "hono/client";
import { AppType } from "@/hono";
import { toast } from "sonner";

const client = hc<AppType>("http://localhost:3000/");

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

/*       const toastConfig = {
        action: {
          label: "X",
          onClick: () => toast.dismiss(),
        },
      } */

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
      <h2 className="text-2xl font-bold mb-4 text-foreground">Add Friend</h2>
      
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
