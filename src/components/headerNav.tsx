"use client";
import React, { useState, useEffect } from "react";
import { Image } from "astro:assets";
import { navigate } from "astro:transitions/client";
import {
  Settings,
  Bell,
  Menu,
  CircleUserRound,
  Moon,
  Sun,
  ScanFace,
  LogOut,
  CircleDashed,
} from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import yaml from "js-yaml";

export function HeaderNav({ user = null, tabs = [] }) {
  const [config, setConfig] = useState(null);
  const [email, setEmail] = useState(user?.email || "");
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isToggled, setToggle] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((response) => response.text())
      .then((data) => {
        try {
          const parsedSettings = yaml.load(data);
          setConfig(parsedSettings);
        } catch (e) {
          console.error("Error parsing YAML:", e);
        }
      })
      .catch((error) => {
        console.error("Error fetching settings:", error);
      });

    // Theme toggle initialization
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      const isDark = savedTheme === "dark";
      setToggle(isDark);
      document.documentElement.classList.toggle("dark", isDark);
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setToggle(prefersDark);
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", isToggled ? "dark" : "light");
    document.documentElement.classList.toggle("dark", isToggled);
  }, [isToggled]);

  useEffect(() => {
    if (email) {
      checkSubscriptionStatus(email);
    }
  }, [email]);

  const handleSubscribeUnsubscribe = async () => {
    try {
      if (!email) {
        console.error("Email is not defined.");
        return;
      }

      const method = subscriptionStatus?.subscribed ? "DELETE" : "POST";
      const response = await fetch("/api/subscribe", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Request failed with status ${response.status}: ${errorText}`,
        );
        return;
      }

      // Update subscription status after action
      await checkSubscriptionStatus(email);
    } catch (error) {
      console.error("Error updating subscription status:", error);
    }
  };

  const checkSubscriptionStatus = async (email) => {
    try {
      if (!email) {
        console.error("Email is required for checking subscription status.");
        return;
      }

      const response = await fetch(
        `/api/subscribe?email=${encodeURIComponent(email)}`,
      );

      if (!response.ok) {
        const text = await response.text();
        console.error("Error checking subscription status:", text);
        return;
      }

      const data = await response.json();

      if (data.error) {
        console.error("Error:", data.error);
        return;
      }

      setSubscriptionStatus({
        subscribed: data.subscribed,
        subscription_date: data.subscribed
          ? new Date(data.subscription_date).toLocaleDateString()
          : null,
      });
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }
  };

  if (!config) {
    return null; // or a loading indicator
  }

  return (
    <header className="shadow-inner w-[100%] bg-secondary/50 backdrop-blur-md bg-opacity-50 lg:max-w-screen-xl top-5 mx-auto sticky border border-secondary z-40 rounded-2xl flex justify-between items-center p-2">
      {/* Subscription Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="sm:max-w-[425px]"
          aria-describedby="dialog-description"
        >
          <DialogHeader>
            <DialogTitle>Subscribe for Updates</DialogTitle>
            <DialogDescription id="dialog-description">
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
      <div className="md:hidden flex items-center justify-between w-full">
        <a
          href="/"
          className="font-bold text-lg text-primary flex items-center"
        >
          <img
            src="/logo.png"
            alt="Logo"
            width="30"
            height="30"
            className="mx-2"
          />
          {config.name}
        </a>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5 text-primary" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{config.name}</DrawerTitle>
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
                {config.mail.enabled && (
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
                    {user.permLevel === 0 && (
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
                    )}
                    {/*
                    <Button
                      variant="ghost"
                      className="w-full justify-start mt-2"
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      Logout
                    </Button>
                    */}
                  </>
                ) : (
                  <Button variant="ghost" className="w-full justify-start">
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

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center w-full">
        <div className="flex items-center justify-between w-full">
          <a
            href="/"
            className="font-bold text-lg text-primary flex items-center"
          >
            <img
              src="/logo.png"
              alt="Logo"
              width="30"
              height="30"
              className="mx-2"
            />
            {config.name}
          </a>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setToggle(!isToggled)}
            >
              {isToggled ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
            </Button>
            {config.mail.enabled && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setDialogOpen(true);
                }}
              >
                <Bell className="h-5 w-5 text-primary" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (user) {
                  navigate("/manage");
                } else {
                  navigate("/login");
                }
              }}
            >
              {user ? (
                <Settings className="h-5 w-5 text-primary" />
              ) : (
                <CircleUserRound className="h-5 w-5 text-primary" />
              )}
            </Button>
          </div>
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2">
          <NavigationMenu>
            <NavigationMenuList className="flex space-x-2">
              {tabs.map((tab) => (
                <NavigationMenuItem key={tab.value}>
                  <NavigationMenuLink asChild>
                    <Button
                      variant="ghost"
                      className={`text-foreground ${tab.active ? "bg-secondary" : ""}`}
                      onClick={() => {
                        navigate(`/${tab.value}`);
                      }}
                    >
                      {tab.label}
                    </Button>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </header>
  );
}
