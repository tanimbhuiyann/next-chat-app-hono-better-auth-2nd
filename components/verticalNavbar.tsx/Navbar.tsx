"use client"

import { useTheme } from 'next-themes'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MessageSquare, UserPlus, Users, Bell, Moon, Sun, User, LogOut, LayoutDashboard } from 'lucide-react'
import { authClient } from "@/lib/auth-client"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function Navbar() {
  const { setTheme, theme } = useTheme()
  const { data: session } = authClient.useSession()
  const router = useRouter()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/sign-in")
  }

  return (
    <div className="flex h-screen">
      <nav className="bg-background border-r border-border w-16 flex flex-col items-center py-4">
        <div className="flex-1 flex flex-col items-center space-y-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => router.push('/dashboard')}
          >
            <LayoutDashboard className="h-6 w-6" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => router.push('/chats')}
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => router.push('/add-friend')}
          >
            <UserPlus className="h-6 w-6" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => router.push('/friend-requests')}
          >
            <Users className="h-6 w-6" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => router.push('/notifications')}
          >
            <Bell className="h-6 w-6" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full" 
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full overflow-hidden">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User profile"}
                  width={36}
                  height={36}
                  className="rounded-full"
                />
              ) : (
                <User className="h-6 w-6" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {session?.user && (
              <>
                <div className="flex items-center gap-2 p-2 border-b">
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User profile"}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{session.user.name}</span>
                    <span className="text-xs text-muted-foreground">{session.user.email}</span>
                  </div>
                </div>
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
      <div className="flex-1">
        <div className="h-6 bg-background border-b border-border">
          {/* Blank horizontal navbar */}
        </div>
      </div>
    </div>
  )
}