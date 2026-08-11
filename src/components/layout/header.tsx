"use client";

import Link from "next/link";
import { Zap, LayoutDashboard, User, List, Clock, LogOut, Settings, Menu, MessageSquare, Repeat, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchUserProfile } from "@/lib/profile-service";
import type { UserProfile } from "@/types/skillswap";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/listings", label: "Listings", icon: List },
  { href: "/exchanges", label: "Exchanges", icon: Repeat },
  { href: "/timebank", label: "Time Bank", icon: Clock },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark mode is active
    if (typeof window !== "undefined") {
      setIsDark(document.documentElement.classList.contains("dark"));
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("skillswap-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("skillswap-theme", "light");
    }
  };

  const loadProfileData = async (userId: string) => {
    try {
      const p = await fetchUserProfile(userId);
      setUserProfile(p);
    } catch (err) {
      console.error("Error loading header profile:", err);
    }
  };

  const checkUnreadMessages = async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", userId)
        .is("read_at", null);

      if (!error && typeof count === "number") {
        setHasUnreadMessages(count > 0);
      }
    } catch (err) {
      console.error("Error checking unread messages:", err);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        loadProfileData(data.user.id);
        checkUnreadMessages(data.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        loadProfileData(currentUser.id);
        checkUnreadMessages(currentUser.id);
      } else {
        setUserProfile(null);
        setHasUnreadMessages(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Re-fetch profile and unread messages whenever user navigates
  useEffect(() => {
    if (user?.id) {
      loadProfileData(user.id);
      checkUnreadMessages(user.id);
    }
  }, [pathname, user?.id]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const NavLink = ({ href, label, icon: Icon }: typeof navItems[0]) => (
    <Button
      variant="ghost"
      asChild
      className={cn(
        "justify-start text-base font-medium",
        pathname === href ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
      )}
      onClick={() => setIsMobileMenuOpen(false)}
    >
      <Link href={href} className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        {label}
      </Link>
    </Button>
  );

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
           <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">SkillSwap</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                asChild
                className={cn(
                  pathname === item.href
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-primary",
                  "px-3 py-2"
                )}
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          {/* Theme Toggle Button */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-muted-foreground hover:text-foreground" />}
            <span className="sr-only">Toggle Theme</span>
          </Button>

          {/* Messages Quick Access Button */}
          <Button variant="ghost" size="icon" asChild title="Direct Messages" className={cn("relative", pathname === "/messages" && "bg-muted")}>
            <Link href="/messages">
              <MessageSquare className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
              {hasUnreadMessages && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
              )}
              <span className="sr-only">Messages</span>
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={userProfile?.avatarUrl || user?.user_metadata?.avatar_url || undefined} alt={userProfile?.name || "User Avatar"} />
                  <AvatarFallback>{(userProfile?.name || user?.user_metadata?.full_name || user?.email || "User").substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userProfile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userProfile?.email || user?.email || "No email"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/messages" className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Messages</span>
                  </div>
                  {hasUnreadMessages && (
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                  )}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center">
                   <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="flex items-center cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Menu className="h-6 w-6" />
                  {hasUnreadMessages && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
                  )}
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0">
                <div className="p-4">
                  <Link href="/dashboard" className="flex items-center space-x-2 mb-6" onClick={() => setIsMobileMenuOpen(false)}>
                    <Zap className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg">SkillSwap</span>
                  </Link>
                </div>
                <nav className="flex flex-col space-y-2 px-4">
                  {navItems.map((item) => (
                    <NavLink key={item.href} {...item} />
                  ))}
                  <Button
                    variant="ghost"
                    asChild
                    className={cn(
                      "justify-start text-base font-medium",
                      pathname === "/messages" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href="/messages" className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        <span>Messages</span>
                      </div>
                      {hasUnreadMessages && (
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                      )}
                    </Link>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
