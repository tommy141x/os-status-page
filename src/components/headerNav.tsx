import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { CheckCircledIcon, GearIcon, Share1Icon } from "@radix-ui/react-icons";
import { ThemeToggle } from "@/components/themeToggle";
import yaml from "js-yaml";

export function HeaderNav({
  user = null,
  tabs = [],
  showSettings = true,
  showUpdates = true,
}) {
  const [config, setConfig] = useState(null);
  const [email, setEmail] = useState(user?.email || "");
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
  }, []);

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
    <div className="flex flex-col w-full h-screen">
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
      <Tabs defaultValue={tabs[0]?.value} className="flex flex-col flex-grow">
        <div className="w-full bg-background shadow-md">
          <div className="w-full px-4 md:px-8 flex items-center justify-between h-16">
            <a href="/" className="flex items-center space-x-2 text-primary">
              <CheckCircledIcon className="hidden md:inline h-5 w-5 text-primary" />
              <p className="text-sm md:text-lg font-bold whitespace-nowrap text-primary">
                {config.name}
              </p>
            </a>
            {tabs.length > 1 && (
              <TabsList className="flex border-0 absolute left-1/2 transform -translate-x-1/2 bg-transparent">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    style={{ fontSize: "1rem" }} // Adjust font size here
                    className="px-6 py-2 data-[state=active]:bg-secondary hover:bg-muted hover:text-primary mx-1" // Hover color change here
                    value={tab.value}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            )}
            <div className="flex items-center space-x-1 md:space-x-2">
              <div className="text-xl mx-1 flex items-center">
                <ThemeToggle />
              </div>
              {showSettings && user?.permLevel === 0 && (
                <a href="/settings">
                  <Button variant="secondary" size="icon">
                    <GearIcon className="h-4 w-4" />
                  </Button>
                </a>
              )}
              {showUpdates && config.mail.enabled && (
                <Button
                  variant="secondary"
                  className="md:space-x-1 flex md:items-center"
                  onClick={() => setDialogOpen(true)}
                >
                  <span className="hidden md:inline">Get Updates</span>
                  <Share1Icon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="flex-grow overflow-hidden">
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="h-full">
              {tab.content}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
