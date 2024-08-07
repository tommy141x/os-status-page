import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { GearIcon, EnvelopeOpenIcon } from "@radix-ui/react-icons";

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

export function GeneralSettings({ settings, setSettings }) {
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

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto p-4 my-10">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <GearIcon className="mr-1.5 w-5 h-5" />
              <CardTitle className="text-2xl">General</CardTitle>
            </div>
          </div>
          <CardDescription>Manage your general settings here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
              <EnvelopeOpenIcon className="mr-1.5 w-5 h-5" />
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
    </>
  );
}
