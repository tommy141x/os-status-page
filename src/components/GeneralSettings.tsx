import { useState, useEffect, useCallback, memo } from "react";
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

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export const GeneralSettings = memo(({ user }) => {
  const [settings, setSettings] = useState({
    name: "",
    categories: [],
    mail: {
      enabled: false,
      smtp: {
        host: "",
        port: "",
        username: "",
        password: "",
      },
      send_from: "",
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debouncedNameAndLogo, setDebouncedNameAndLogo] = useState({
    name: settings.name,
    logoUpdated: false,
  });

  const debouncedUpdateNameAndLogo = useCallback(
    debounce((name, logoUpdated) => {
      setDebouncedNameAndLogo({ name, logoUpdated });
    }, 900),
    [],
  );

  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then((fetchedSettings) => {
        setSettings((prev) => ({ ...prev, ...fetchedSettings }));
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch settings");
        setLoading(false);
      });
  }, []);

  const saveSettingsToServer = useCallback(
    debounce((newSettings) => {
      saveSettings(newSettings)
        .then(() => {
          setSettingsSaved(true);
          setTimeout(() => setSettingsSaved(false), 100); // Reset after a short delay
        })
        .catch((error) => {
          console.error("Failed to save settings", error);
        });
    }, 500),
    [],
  );

  const handleSettingChange = useCallback(
    (newSettings) => {
      setSettings(newSettings);
      saveSettingsToServer(newSettings);
    },
    [saveSettingsToServer],
  );

  const handleMailSettingChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setSettings((prev) => {
        const newSettings = {
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
        };
        saveSettingsToServer(newSettings);
        return newSettings;
      });
    },
    [saveSettingsToServer],
  );

  const handleMailEnabledChange = useCallback(
    (enabled) => {
      setSettings((prev) => {
        const newSettings = {
          ...prev,
          mail: { ...prev.mail, enabled },
        };
        saveSettingsToServer(newSettings);
        return newSettings;
      });
    },
    [saveSettingsToServer],
  );

  const handleImageUpload = useCallback(
    async (event) => {
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

            // Set logoUpdated to true
            debouncedUpdateNameAndLogo(debouncedNameAndLogo.name, true);

            // After a short delay, set logoUpdated back to false
            setTimeout(() => {
              debouncedUpdateNameAndLogo(debouncedNameAndLogo.name, false);
            }, 1000);
          } else {
            console.error("Upload failed");
          }
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      }
    },
    [debouncedUpdateNameAndLogo, debouncedNameAndLogo.name],
  );

  const handleNameChange = useCallback(
    (e) => {
      const newName = e.target.value;
      setSettings((prev) => {
        const newSettings = {
          ...prev,
          name: newName,
        };
        saveSettingsToServer(newSettings);
        debouncedUpdateNameAndLogo(newName, debouncedNameAndLogo.logoUpdated);
        return newSettings;
      });
    },
    [
      saveSettingsToServer,
      debouncedUpdateNameAndLogo,
      debouncedNameAndLogo.logoUpdated,
    ],
  );

  if (error) return <div>{error}</div>;

  return (
    <div className="flex flex-col min-h-screen max-w-7xl mx-auto w-full p-4">
      <HeaderNav
        user={user}
        tabs={[
          { value: "manage", label: "General", active: true },
          { value: "manage/services", label: "Services" },
          { value: "manage/users", label: "Users" },
        ]}
        key={`${debouncedNameAndLogo.name}-${debouncedNameAndLogo.logoUpdated}`}
      />
      <Card className="w-full max-w-4xl mx-auto p-4 my-10">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Settings className="mr-1.5 w-6 h-6" />
              <CardTitle className="text-2xl">General</CardTitle>
            </div>
          </div>
          <CardDescription>Manage your general settings here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col">
              <Label htmlFor="logoUpload" className="mb-2">
                Application Logo
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
              onChange={handleNameChange}
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
