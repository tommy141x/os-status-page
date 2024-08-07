import { useState, useEffect } from "react";
import * as yaml from "js-yaml";
import { HeaderNav } from "@/components/headerNav";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { ServicesSettings } from "@/components/settings/ServicesSettings";
import { UsersSettings } from "@/components/settings/UsersSettings";
import { fetchSettings, saveSettings } from "@/lib/client-utils";

export function Settings({ user }) {
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

  if (error) return <div>{error}</div>;

  return (
    <HeaderNav
      user={user}
      showSettings={false}
      showUpdates={false}
      tabs={[
        {
          value: "general",
          label: "General",
          content: (
            <GeneralSettings settings={settings} setSettings={setSettings} />
          ),
        },
        {
          value: "services",
          label: "Services",
          content: (
            <ServicesSettings settings={settings} setSettings={setSettings} />
          ),
        },
        {
          value: "users",
          label: "Users",
          content: <UsersSettings />,
        },
      ]}
    />
  );
}
