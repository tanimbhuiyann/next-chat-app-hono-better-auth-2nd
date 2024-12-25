'use client';

import { useState } from 'react';
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, UserPlus, Users, Moon, Sun, User, LogOut, Bell } from 'lucide-react';
import Image from "next/image";

type NavbarProps = {
  setCurrentView: (view: string) => void;
  onSignOut: () => Promise<void>;
  userImage: string | null;
  userName: string | null;
};

export default function Navbar({
  setCurrentView,
  onSignOut,
  userImage,
  userName,
}: NavbarProps) {
  const { setTheme, theme } = useTheme();
  const [activeView, setActiveView] = useState('chats');

  const handleViewChange = (view: string) => {
    setActiveView(view);
    setCurrentView(view);
  };

  const getButtonClass = (view: string) => {
    return `rounded-md transition-colors ${
      activeView === view
        ? 'bg-primary text-primary-foreground'
        : 'bg-background hover:bg-accent hover:text-accent-foreground'
    }`;
  };

  return (
    <div className="flex h-full">
      <nav className="bg-background border-r border-border w-16 flex flex-col items-center py-6">
        <div className="flex-1 flex flex-col items-center space-y-8">
          <Button
            variant="outline"
            size="icon"
            className={getButtonClass('chats')}
            onClick={() => handleViewChange('chats')}
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={getButtonClass('addFriend')}
            onClick={() => handleViewChange('addFriend')}
          >
            <UserPlus className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={getButtonClass('friendRequests')}
            onClick={() => handleViewChange('friendRequests')}
          >
            <Users className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={getButtonClass('notifications')}
            onClick={() => handleViewChange('notifications')}
          >
            <Bell className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-md bg-background hover:bg-accent hover:text-accent-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-6 w-6" />
            ) : (
              <Moon className="h-6 w-6" />
            )}
          </Button>
        </div>
        <div className="mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-md bg-background hover:bg-accent hover:text-accent-foreground"
              >
                {userImage ? (
                  <Image
                    src={userImage}
                    alt={userName || "User profile"}
                    width={40}
                    height={40}
                    className="rounded-md"
                  />
                ) : (
                  <User className="h-6 w-6" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="font-medium">
                <User className="mr-2 h-4 w-4" />
                <span>{userName || "User"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </div>
  );
}

