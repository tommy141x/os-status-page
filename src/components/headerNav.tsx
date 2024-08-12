"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { navigate } from "astro:transitions/client";
import {
  Settings,
  Bell,
  Menu,
  CircleUserRound,
  Moon,
  Sun,
  ScanFace,
  Eye,
  EyeOff,
  CircleDashed,
} from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import yaml from "js-yaml";
import { prefetch } from "astro:prefetch";

export function HeaderNav({ user = null, tabs = [] }) {
  const [config, setConfig] = useState(null);
  const [email, setEmail] = useState(user?.email || "");
  const [newEmail, setNewEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false); //change to subDialogOpen
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [isToggled, setToggle] = useState(false);

  const handlePrefetch = useCallback((path) => {
    prefetch(path, { ignoreSlowConnection: true });
  }, []);

  const showEditUserButton = useMemo(() => {
    if (!user) return false;
    if (user.permLevel > 0) return true;
    const activeTab = tabs.find((tab) => tab.active);
    return activeTab && activeTab.value.includes("manage");
  }, [user, tabs]);

  const handleUpdateUser = async () => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          email: newEmail,
          ...(newPassword && { password: newPassword }),
        }),
      });
      setUserDialogOpen(false);
      setNewPassword("");
      if (!response.ok) throw new Error("Failed to update user");
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/settings");
      const data = await response.text();
      const parsedSettings = yaml.load(data);
      setConfig(parsedSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  }, []);

  const fetchLogo = useCallback(async () => {
    try {
      const response = await fetch("/api/upload");
      if (!response.ok) throw new Error("Failed to fetch logo");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setLogoUrl(url);
    } catch (error) {
      console.error("Error fetching logo:", error);
      setLogoUrl("/logo.png");
    }
  }, []);

  const initializeTheme = useCallback(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const isDark = savedTheme ? savedTheme === "dark" : prefersDark;
    setToggle(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    fetchLogo();
    fetchConfig();
    initializeTheme();
  }, [fetchLogo, fetchConfig, initializeTheme]);

  useEffect(() => {
    localStorage.setItem("theme", isToggled ? "dark" : "light");
    if (isToggled) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isToggled]);

  const checkSubscriptionStatus = useCallback(async (email) => {
    if (!email) return;
    try {
      const response = await fetch(
        `/api/subscribe?email=${encodeURIComponent(email)}`,
      );
      if (!response.ok) throw new Error("Error checking subscription status");
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setSubscriptionStatus({
        subscribed: data.subscribed,
        subscription_date: data.subscribed
          ? new Date(data.subscription_date).toLocaleDateString()
          : null,
      });
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }
  }, []);

  useEffect(() => {
    if (email) checkSubscriptionStatus(email);
  }, [email, checkSubscriptionStatus]);

  const handleSubscribeUnsubscribe = useCallback(async () => {
    if (!email) {
      console.error("Email is not defined.");
      return;
    }
    try {
      const method = subscriptionStatus?.subscribed ? "DELETE" : "POST";
      const response = await fetch("/api/subscribe", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok)
        throw new Error(`Request failed with status ${response.status}`);
      await checkSubscriptionStatus(email);
    } catch (error) {
      console.error("Error updating subscription status:", error);
    }
  }, [email, subscriptionStatus, checkSubscriptionStatus]);

  const toggleTheme = useCallback(() => setToggle((prev) => !prev), []);

  const memoizedTabs = useMemo(
    () =>
      tabs.map((tab) => (
        <NavigationMenuItem key={tab.value}>
          <NavigationMenuLink asChild>
            <Button
              variant="ghost"
              className={`text-foreground ${tab.active ? "bg-secondary" : ""}`}
              onClick={() => navigate(`/${tab.value}`)}
              onMouseEnter={() => handlePrefetch(`/${tab.value}`)}
            >
              {tab.label}
            </Button>
          </NavigationMenuLink>
        </NavigationMenuItem>
      )),
    [tabs, handlePrefetch],
  );

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  //Drawer slows down page render
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Adjust breakpoint as needed
    };

    handleResize(); // Check on mount
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header className="shadow-inner w-[100%] bg-secondary/50 backdrop-blur-md bg-opacity-50 lg:max-w-screen-xl top-5 mx-auto sticky border border-secondary z-40 rounded-2xl flex justify-between items-center p-2">
      {/* User Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update your user information here.
            </DialogDescription>
            <DialogDescription className="text-primary/30">
              Leave password blank to keep your current password.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-[auto,1fr] gap-10 items-center">
              <Label htmlFor="newEmail" className="text-right">
                Email
              </Label>
              <Input
                id="newEmail"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-[auto,1fr] gap-4 items-center">
              <Label htmlFor="newPassword" className="text-right">
                Password
              </Label>
              <div className="relative w-full">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pr-10" // Full width and right padding
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePasswordVisibility}
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-full"
                  tabIndex={-1} // Prevents focus when tabbing through form
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleUpdateUser}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Subscription Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Subscribe for Updates</DialogTitle>
            <DialogDescription>
              Enter your email to subscribe to status updates.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            {subscriptionStatus && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-4 text-center">
                  {subscriptionStatus.subscribed && (
                    <p className="text-muted-foreground">
                      Subscribed on: {subscriptionStatus.subscription_date}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={handleSubscribeUnsubscribe}
              variant="secondary"
            >
              {subscriptionStatus?.subscribed ? "Unsubscribe" : "Subscribe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Menu Trigger and Logo */}
      {isMobile && (
        <div className="md:hidden flex items-center justify-between w-full">
          <a
            href="/"
            className="font-bold text-lg text-primary flex items-center"
          >
            <img
              src={logoUrl}
              alt="Logo"
              width="30"
              height="30"
              className="mx-2"
            />
            {config?.name}
          </a>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5 text-primary" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{config?.name}</DrawerTitle>
              </DrawerHeader>
              <div className="p-4">
                {tabs.map((tab) => (
                  <Button
                    key={tab.value}
                    variant="ghost"
                    className="w-full justify-start mb-2"
                    onClick={() => {
                      navigate(`/${tab.value}`);
                    }}
                  >
                    <CircleDashed className="h-5 w-5 mr-2" />
                    {tab.label}
                  </Button>
                ))}
                <Separator className="my-2" />
                <div className="flex flex-col">
                  {config?.mail.enabled && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start mb-2"
                      onClick={() => {
                        setDialogOpen(true);
                      }}
                    >
                      <Bell className="h-5 w-5 mr-2" />
                      Subscribe/Updates
                    </Button>
                  )}
                </div>
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    className="w-full justify-start mb-2"
                    onClick={() => setToggle(!isToggled)}
                  >
                    {isToggled ? (
                      <Sun className="h-5 w-5 mr-2" />
                    ) : (
                      <Moon className="h-5 w-5 mr-2" />
                    )}
                    {isToggled ? <p>Light Mode</p> : <p>Dark Mode</p>}
                  </Button>
                </div>

                <Separator className="mb-2" />
                <div className="flex flex-col">
                  {user ? (
                    <>
                      {showEditUserButton ? (
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => setUserDialogOpen(true)}
                        >
                          <CircleUserRound className="h-5 w-5 mr-2" />
                          Edit User
                        </Button>
                      ) : (
                        user.permLevel === 0 && (
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            asChild
                          >
                            <a href="/manage" className="flex items-center">
                              <Settings className="h-5 w-5 mr-2" />
                              Manage
                            </a>
                          </Button>
                        )
                      )}
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate("/login")}
                    >
                      <ScanFace className="h-5 w-5 mr-2" />
                      Login
                    </Button>
                  )}
                </div>
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      )}
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center w-full">
        <div className="flex items-center justify-between w-full">
          <a
            href="/"
            className="font-bold text-lg text-primary flex items-center"
          >
            <img
              src={logoUrl}
              alt="Logo"
              width="30"
              height="30"
              className="mx-2"
            />
            {config?.name}
          </a>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isToggled ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
            </Button>
            {config?.mail.enabled && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDialogOpen(true)}
              >
                <Bell className="h-5 w-5 text-primary" />
              </Button>
            )}
            {showEditUserButton ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setUserDialogOpen(true)}
              >
                <CircleUserRound className="h-5 w-5 text-primary" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(user ? "/manage" : "/login")}
              >
                {user ? (
                  <Settings className="h-5 w-5 text-primary" />
                ) : (
                  <CircleUserRound className="h-5 w-5 text-primary" />
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2">
          <NavigationMenu>
            <NavigationMenuList className="flex space-x-2">
              {memoizedTabs}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </header>
  );
}
