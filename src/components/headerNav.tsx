import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CheckCircledIcon, GearIcon, Share1Icon } from "@radix-ui/react-icons";
import { ThemeToggle } from "@/components/themeToggle";
import yaml from "js-yaml";
import { useEffect, useState } from "react";

export function HeaderNav({
  user = null,
  tabs = [],
  showSettings = true,
  showUpdates = true,
}) {
  const [config, setConfig] = useState(null);

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

  if (!config) {
    return null; // or a loading indicator
  }

  return (
    <div className="flex flex-col w-full h-screen">
      <Tabs defaultValue={tabs[0]?.value} className="flex flex-col flex-grow">
        <div className="w-full bg-background shadow-md">
          <div className="w-full px-8 flex items-center justify-between h-16">
            <a href="/" className="flex items-center space-x-2 text-primary">
              <CheckCircledIcon className="h-5 w-5 text-primary" />
              <p className="text-xl font-bold whitespace-nowrap text-primary">
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
            <div className="flex items-center space-x-2">
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
                <Button variant="secondary" className="flex items-center">
                  Get Updates
                  <Share1Icon className="ml-2 h-4 w-4" />
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
