import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { hc } from "hono/client";
import { AppType } from "@/hono";
import Image from "next/image";
import { User } from "lucide-react";
const client = hc<AppType>("http://localhost:3000/");

type Friend = {
  id: string;
  name: string;
  image: string | null;
  status: string;
};

export default function FriendList({
  onSelectFriend,
  userEmail,
}: {
  onSelectFriend: (friend: { name: string; id: string }) => void;
  userEmail: string;
}) {
  const [friendList, setFriendList] = useState<Friend[]>([]);

  useEffect(() => {
    const fetchFriendList = async () => {
      if (!userEmail) return;

      try {
        const response = await client.api["friend-request"].friends[
          ":email"
        ].$get({
          param: { email: userEmail },
        });

        if (response.ok) {
          const data = await response.json();
          const friends = Array.isArray(data) ? data : data.friends || [];
          setFriendList(friends);
        }
      } catch (error) {
        console.error("Error fetching friend list", error);
        setFriendList([]);
      }
    };

    fetchFriendList();
  }, [userEmail]);

  return (
    <div className="w-96 bg-background border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">
          Friends ({friendList.length})
        </h2>
      </div>
      <ScrollArea className="flex-1">
      <div 
          className="flex items-center p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer"
          onClick={() => onSelectFriend({ 
            name: 'MY AI', 
            id: 'ai-assistant'
          })}
        >
          <User className="w-10 h-10 relative mr-3" />
          <h3 className="font-semibold text-foreground">MY AI</h3>
        </div>
        <ul>
          {friendList.map((friend) => (
            <li
              key={friend.id}
              className="flex items-center p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer"
              onClick={() =>
                onSelectFriend({ name: friend.name, id: friend.id })
              }
            >
              <div className="w-10 h-10 relative mr-3">
                <Image
                  src={friend.image || "/default-profile.png"}
                  alt={friend.name}
                  layout="fill"
                  className="rounded-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{friend.name}</h3>
                <p className="text-sm text-muted-foreground">{friend.status}</p>
              </div>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
