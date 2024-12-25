"use client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input"; // Update 1
import { Chat } from "../simple chatBox/chat";

//1.-----------------------------
import { AppType } from "@/hono";
import { hc } from "hono/client";
import { useEffect, useState } from "react";

const client = hc<AppType>("http://localhost:3000/");
//---------------------------------------------

type FriendRequest = {
  friendRequest: {
    createdAt: string;
    id: string;
    receiverEmail: string;
    receiverId: string;
    senderEmail: string;
    senderId: string;
    status: string;
    updatedAt: string;
  };
  sender: {
    createdAt: string;
    email: string;
    emailVerified: boolean;
    id: string;
    image: string | null;
    name: string;
    updatedAt: string;
  };
};



export default function Dashboard() {
  const {
    data: session,
    /*  error: sessionError,
    isPending: sessionIsLoading, */
  } = authClient.useSession();

  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };
  console.log("my session", session);

  //2--------------------------------------------

  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]); //problem is here
  const [FriendList, setFriendList] = useState<any[]>([]);
  const [activeChatFriend, setActiveChatFriend] = useState<{ name: string; id: string } | null>(null);

  const fetchIncomingRequest = async () => {
    if (!session?.user.email) return;

    try {
      const response = await client.api["friend-request"].incoming[
        ":email"
      ].$get({
        param: { email: session.user.email },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Incoming Requests:", data);

        const requestsArray = Array.isArray(data)
          ? data
          : data.incomingRequest || [];
        console.log("requestArray", requestsArray);
        setIncomingRequests(requestsArray); // the problem is occuring here Argument of type
        //console.log("recive",setIncomingRequests.length);
        return;
      } else {
        console.error("failed to fetch incoming request", response.status);
        setIncomingRequests([]);
      }
    } catch (error) {
      console.error("Error fetching incoming request", error);
      setIncomingRequests([]);
    }
  };

  const fetchFriendList = async () => {
    if (!session?.user.email) return;

    try {
      const response = await client.api["friend-request"].friends[
        ":email"
      ].$get({
        param: { email: session.user.email },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Friends List:", data);

        const requestsFriendList = Array.isArray(data)
          ? data
          : data.friends || [];
        console.log("requestFriendArray", requestsFriendList);
        setFriendList(requestsFriendList);
        //console.log("recive",setIncomingRequests.length);
        return;
      } else {
        console.error("failed to fetch incoming request", response.status);
        setFriendList([]);
      }
    } catch (error) {
      console.error("Error fetching incoming request", error);
      setFriendList([]);
    }
  };

  useEffect(() => {
    fetchIncomingRequest();
    fetchFriendList();
  }, [session?.user.email]);

  const [addNewFriend, setNewFriend] = useState("");

  const sendNewFriendRequest = async () => {
    if (!addNewFriend.trim()) return;

    try {
      await client.api["friend-request"].send.$post({
        json: {
          senderEmail: session?.user.email,
          receiverEmail: addNewFriend,
        },
      });

      setNewFriend("");
      console.log("Request send");
    } catch (error) {
      console.error("Error sending friend request", error);
    }
  };

  const updateStatus = async (id: string, currentStatus: string) => {
    try {
      if (currentStatus !== "PENDING") {
        console.error("Cannot update, the status is not 'pending'");
        return;
      }

      await client.api["friend-request"].update[":id"].$put({
        param: { id },
        json: { status: currentStatus }, //
      });
      fetchIncomingRequest();
    } catch (error) {
      console.error("Error updating friend request", error);
    }
  };

  const deleteFriendRequest = async (id: string) => {
    try {
      await client.api["friend-request"].delete[":id"].$delete({
        param: { id },
      });
      fetchIncomingRequest();
    } catch (error) {
      console.error("Error deleting friend request", error);
    }
  };

  const startChat = (friend: { name: string; id: string }) => {
    
    setActiveChatFriend(friend);
    
  };

  //-------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col-2 items-center justify-center">
      {/*  <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>
      </header>  */}
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Welcome!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600">
            Thank you for logging in. This is your simple dashboard.
          </p>
          {/* {sessionIsLoading && <p>Loading...</p>} */}

          <p>Signed in as {session?.user.email}</p>
          {/* <p>Error: {sessionError?.message}</p>
          <p>Loading...</p> */}
          <div className="flex items-center gap-5 border rounded-full">
            <Image
              src={session?.user.image || "/default-profile.png"} // Fallback image
              width={50}
              height={50}
              alt={session?.user.name || "User profile picture"}
              className="rounded-full"
            />

            <h1>{session?.user.name}</h1>
          </div>
          {/* ----------------------------------------------------------------------------------- */}
          {/*  sending friend request */}
          {/* ----------------------------------------------------------------------------------- */}

          <div className="flex w-full max-w-sm items-center space-x-2 p-4">
            <Input
              type="email"
              placeholder="name@example.com"
              value={addNewFriend}
              onChange={(e) => setNewFriend(e.target.value)}
            />
            <Button
              type="submit"
              disabled={!addNewFriend}
              onClick={() => sendNewFriendRequest()}
            >
              Add Friend
            </Button>
          </div>
          {/* --------------------------------------------------------------------------------- */}
          {/*  displaying friends  */}
          {/* --------------------------------------------------------------------------------- */}
          <div className="border gap-4 w-full p-4">
            <h2>Your Friend ({FriendList.length})</h2>
            {FriendList.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between mb-2"
              >
                <Image
                  src={request.image || "/default-profile.png"}
                  width={50}
                  height={50}
                  alt={request.name || "User profile name"}
                  className="rounded-full"
                />
                <div>
                  <p>{request.name}</p>
                  <p>Status: {request.status}</p>
                </div>
                <div>
                  <Button
                    variant="outline"
                    className="mr-2"
                    onClick={() =>
                      startChat({
                        name: request.name,
                        id: request.id,
                      })
                    }
                  >
                    Message
                  </Button>
                  {/*  <Button variant="destructive"
                  onClick={()=> deleteFriendRequest(request.friendRequest.id)}
                  >Decline</Button> */}
                </div>
              </div>
            ))}
          </div>

          {/* ----------------------------------------------------------------------------------- */}
          {/* show friend request */}
          <div className="gap-4 w-full p-2">
            <h2>
              Incoming Friend Requests (
              {
                incomingRequests.filter(
                  (request) => request.friendRequest.status !== "ACCEPTED"
                ).length
              }
              )
            </h2>
            {incomingRequests
              .filter((request) => request.friendRequest.status !== "ACCEPTED")
              .map((request) => (
                <div
                  key={request.friendRequest.id}
                  className="flex items-center justify-between mb-2"
                >
                  <Image
                    src={request.sender.image || "/default-profile.png"}
                    width={50}
                    height={50}
                    alt={request.sender.name || "User profile name"}
                    className="rounded-full"
                  />
                  <div>
                    <p>{request.friendRequest.senderEmail}</p>
                    <p>Status: {request.friendRequest.status}</p>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      className="mr-2"
                      onClick={() =>
                        updateStatus(
                          request.friendRequest.id,
                          request.friendRequest.status
                        )
                      }
                    >
                      Accept
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        deleteFriendRequest(request.friendRequest.id)
                      }
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="destructive" onClick={handleSignOut}>
            Sign Out
          </Button>
        </CardFooter>
      </Card>

      {activeChatFriend ? (
        <Chat
          friendName={activeChatFriend.name}
          friendId={activeChatFriend.id}
          onClose={() => setActiveChatFriend(null)}
        />
      ) : (
        <div className="border gap-4 p-4"></div>
      )}
    </div>
  );
}
