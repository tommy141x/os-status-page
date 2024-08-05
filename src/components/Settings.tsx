import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeToggle } from "@/components/themeToggle";
import * as yaml from "js-yaml";

export function Settings({ user }) {
  const [settings, setSettings] = useState<any>({ services: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log("Page Loaded");

  useEffect(() => {
    // Fetch current settings on component mount
    fetch("/api/settings")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }
        return response.text();
      })
      .then((data) => {
        try {
          const parsedData = yaml.load(data);
          setSettings(parsedData);
          console.log("Fetched settings:", parsedData);
        } catch (err) {
          setError("Failed to parse settings");
          console.error("Error parsing YAML:", err);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch settings");
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const [key, index, property] = name.split(/[\[\].]+/);

    if (key === "services") {
      const newServices = [...settings.services];
      newServices[index][property] = value;
      setSettings((prevSettings) => ({
        ...prevSettings,
        services: newServices,
      }));
    } else {
      setSettings((prevSettings) => ({
        ...prevSettings,
        [name]: value,
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const [key, index, property] = name.split(/[\[\].]+/);

    if (key === "services") {
      const newServices = [...settings.services];
      newServices[index][property] = checked;
      setSettings((prevSettings) => ({
        ...prevSettings,
        services: newServices,
      }));
    } else {
      setSettings((prevSettings) => ({
        ...prevSettings,
        [name]: checked,
      }));
    }
  };

  const handleAddService = () => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      services: [
        ...prevSettings.services,
        {
          name: "",
          description: "",
          url: "",
          hide_url: false,
          expected_response_code: 200,
        },
      ],
    }));
  };

  const handleRemoveService = (index: number) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      services: prevSettings.services.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const yamlData = yaml.dump(settings);
      await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-yaml",
        },
        body: yamlData,
      });
      alert("Settings updated successfully");
    } catch (error) {
      alert("Failed to update settings");
      console.error("Submit error:", error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div
          className="flex justify-between items-center"
          style={{ fontSize: "1.5rem" }}
        >
          <CardTitle className="text-2xl">Settings</CardTitle>
          <ThemeToggle />
        </div>
        <CardDescription>
          Manage your application settings here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Render services configuration */}
          {settings.services && settings.services.length > 0 ? (
            <div>
              <CardTitle className="text-xl">Services</CardTitle>
              {settings.services.map((service: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor={`service-name-${index}`}>Name</Label>
                    <Button
                      type="button"
                      onClick={() => handleRemoveService(index)}
                      className="text-red-500"
                    >
                      Remove
                    </Button>
                  </div>
                  <Input
                    id={`service-name-${index}`}
                    name={`services[${index}].name`}
                    value={service.name}
                    onChange={handleChange}
                  />
                  <Label htmlFor={`service-description-${index}`}>
                    Description
                  </Label>
                  <Textarea
                    id={`service-description-${index}`}
                    name={`services[${index}].description`}
                    value={service.description}
                    onChange={handleChange}
                  />
                  <Label htmlFor={`service-url-${index}`}>URL</Label>
                  <Input
                    id={`service-url-${index}`}
                    name={`services[${index}].url`}
                    value={service.url}
                    onChange={handleChange}
                  />
                  <div className="flex items-center mb-2">
                    <Label
                      htmlFor={`service-hide-url-${index}`}
                      className="mr-2"
                    >
                      Hide URL
                    </Label>
                    <Checkbox
                      id={`service-hide-url-${index}`}
                      name={`services[${index}].hide_url`}
                      checked={service.hide_url}
                      onChange={handleCheckboxChange}
                    />
                  </div>
                  <Label htmlFor={`service-expected-response-code-${index}`}>
                    Expected Response Code
                  </Label>
                  <Input
                    id={`service-expected-response-code-${index}`}
                    name={`services[${index}].expected_response_code`}
                    type="number"
                    value={service.expected_response_code}
                    onChange={handleChange}
                  />
                </div>
              ))}
              <Button
                type="button"
                onClick={handleAddService}
                className="w-full mt-4"
              >
                Add Service
              </Button>
            </div>
          ) : (
            <div>
              <CardTitle className="text-xl">Services</CardTitle>
              <Button
                type="button"
                onClick={handleAddService}
                className="w-full mt-4"
              >
                Add Service
              </Button>
            </div>
          )}

          {/* Render other settings */}
          <div>
            <Label htmlFor="data-retention-days">Data Retention Days</Label>
            <Input
              id="data-retention-days"
              name="data_retention_days"
              type="number"
              value={settings.data_retention_days || ""}
              onChange={handleChange}
            />
            <Label htmlFor="check-interval-seconds">
              Check Interval Seconds
            </Label>
            <Input
              id="check-interval-seconds"
              name="check_interval_seconds"
              type="number"
              value={settings.check_interval_seconds || ""}
              onChange={handleChange}
            />
            <Label htmlFor="secret">Secret</Label>
            <Input
              id="secret"
              name="secret"
              type="text"
              value={settings.secret || ""}
              onChange={handleChange}
            />
          </div>

          <CardFooter>
            <Button type="submit" className="w-full">
              Save Settings
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
