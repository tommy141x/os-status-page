import { useState, useEffect, memo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { HeaderNav } from "@/components/headerNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Inbox, Settings, ImageUp } from "lucide-react";
import { fetchSettings, saveSettings } from "@/lib/client-utils";

// Helper function for input fields
function InputField({ label, id, name, value, onChange, type = "text" }) {
  return (
    <div className="flex flex-col">
      <Label htmlFor={id} className="mb-2">
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        className="w-full"
      />
    </div>
  );
}

export const GeneralSettings = memo(({ user }) => {
  const [settings, setSettings] = useState({ categories: [], mail: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSettings()
      .then((fetchedSettings) => {
        setSettings(fetchedSettings);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch settings");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!loading) {
      saveSettings(settings).catch((error) => {
        console.error("Failed to autosave settings", error);
      });
    }
  }, [settings, loading]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  const handleMailSettingChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      mail: {
        ...prev.mail,
        ...(name.startsWith("smtp.")
          ? {
              smtp: {
                ...prev.mail.smtp,
                [name.split(".")[1]]: value,
              },
            }
          : { [name]: value }),
      },
    }));
  };

  const handleMailEnabledChange = (enabled) => {
    setSettings((prev) => ({
      ...prev,
      mail: { ...prev.mail, enabled },
    }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          console.log("Upload successful:", result);
          // Handle successful upload (e.g., show success message, update UI)
        } else {
          console.error("Upload failed");
          // Handle error (e.g., show error message)
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        // Handle error (e.g., show error message)
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-7xl mx-auto w-full p-4">
      <HeaderNav
        user={user}
        tabs={[
          { value: "manage", label: "General", active: true },
          { value: "manage/services", label: "Services" },
          { value: "manage/users", label: "Users" },
        ]}
      />
      <Card className="w-full max-w-4xl mx-auto p-4 my-10">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Settings className="mr-1.5 w-6 h-6" />
              <CardTitle className="text-2xl">General</CardTitle>
            </div>
          </div>
          <CardDescription>
            Manage your general settings here -{" "}
            <small className="text-muted-foreground">
              (refresh to see changes)
            </small>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col">
              <Label htmlFor="logoUpload" className="mb-2">
                Application Logo{" "}
                <small className="text-muted-foreground">
                  (requires a restart to take effect)
                </small>
              </Label>
              <input
                id="logoUpload"
                type="file"
                accept="image/png"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
              <Button
                variant="secondary"
                id="logoUpload"
                onClick={() => document.getElementById("logoUpload").click()}
              >
                Set Image
                <ImageUp className="ml-2" />
              </Button>
            </div>
            <InputField
              label="Application Name"
              id="name"
              name="name"
              type="text"
              value={settings.name || ""}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>
      <Card className="w-full max-w-4xl mx-auto p-4 my-5">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Inbox className="mr-1.5 w-6 h-6" />
              <CardTitle className="text-2xl">Mail</CardTitle>
            </div>
            <Switch
              checked={settings.mail.enabled}
              onCheckedChange={handleMailEnabledChange}
            />
          </div>
          <CardDescription>
            Manage your mail related settings here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <InputField
              label="SMTP Host"
              id="smtp-host"
              name="smtp.host"
              value={settings.mail?.smtp?.host || ""}
              onChange={handleMailSettingChange}
            />
            <InputField
              label="SMTP Port"
              id="smtp-port"
              name="smtp.port"
              type="number"
              value={settings.mail?.smtp?.port || ""}
              onChange={handleMailSettingChange}
            />
            <InputField
              label="SMTP Username"
              id="smtp-username"
              name="smtp.username"
              value={settings.mail?.smtp?.username || ""}
              onChange={handleMailSettingChange}
            />
            <InputField
              label="SMTP Password"
              id="smtp-password"
              name="smtp.password"
              type="password"
              value={settings.mail?.smtp?.password || ""}
              onChange={handleMailSettingChange}
            />
            <InputField
              label="Send From"
              id="send-from"
              name="send_from"
              value={settings.mail?.send_from || ""}
              onChange={handleMailSettingChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
