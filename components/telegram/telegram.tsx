"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import FriendList from "../main dashboard/FriendList";
import ChatArea from "../main dashboard/ChatArea";
import AddFriend from "../main dashboard/AddFriend";
import FriendRequests from "../main dashboard/FriendRequests";
import Navbar from "../main dashboard/verticalNavbar";
import Loading from "../main dashboard/loading";

export default function TelegramClone() {
  const [selectedFriend, setSelectedFriend] = useState<{
    name: string;
    id: string;
  } | null>(null);
  const [currentView, setCurrentView] = useState("chats");

  const sessionResponse = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!sessionResponse.data && !sessionResponse.isPending) {
      router.push("/sign-in");
    }
  }, [sessionResponse, router]);

  if (sessionResponse.isPending) {
    return <div><Loading/></div>;
  }

  const session = sessionResponse.data;

  if (!session) {
    router.push("/sign-in");
    return null; // Avoid rendering anything until redirection is handled
  }

  const renderMainContent = () => {
    switch (currentView) {
      case "chats":
        return (
          <>
            <FriendList
              onSelectFriend={setSelectedFriend}
              userEmail={session.user.email}
            />
            <ChatArea selectedFriend={selectedFriend} />
          </>
        );
      case "addFriend":
        return <AddFriend userEmail={session.user.email} />;
      case "friendRequests":
        return <FriendRequests userEmail={session.user.email} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Navbar
        setCurrentView={setCurrentView}
        onSignOut={async () => {
          await authClient.signOut();
          router.push("/sign-in");
        }}
        userImage={session.user.image || null}
        userName={session.user.name}
      />
      <div className="flex-1 flex overflow-hidden">{renderMainContent()}</div>
    </div>
  );
}
